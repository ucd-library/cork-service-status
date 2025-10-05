set search_path to cork_status, api, public;

CREATE TABLE IF NOT EXISTS cork_status.service (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text NOT NULL UNIQUE,
  tags text[],
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL
);

CREATE OR REPLACE TRIGGER service_updated_trigger
  BEFORE UPDATE ON cork_status.service
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cork_status.get_service_id(name_or_id text)
  RETURNS UUID AS $$
  DECLARE
    oid UUID;
  BEGIN
    SELECT service_id INTO oid FROM cork_status.service
    WHERE name = name_or_id OR service_id=try_cast_uuid(name_or_id);
    IF oid IS NULL THEN
      RAISE EXCEPTION 'Service not found: %', name_or_id;
    END IF;
    RETURN oid;
  END;
$$ LANGUAGE plpgsql;








CREATE OR REPLACE FUNCTION cork_status.create_service(payload jsonb) 
  RETURNS UUID AS $$
  DECLARE
    sid UUID;
    prop jsonb;
    val  jsonb;
    sprop UUID;
    ord int;
    tags text[];
    role_name text;
    rid   uuid;
    creator_id uuid;
    updater_id uuid;

  BEGIN
    SELECT COALESCE(ARRAY_AGG(t), '{}')::text[]
    INTO tags
    FROM jsonb_array_elements_text(COALESCE(payload->'tags','[]'::jsonb)) as t;

    creator_id := COALESCE(
      try_cast_uuid(payload->>'created_by'),
      CASE WHEN payload ? 'user' AND payload->'user' ? 'username'
        THEN cork_status.ensure_user(payload->'user'->>'username')
        ELSE NULL 
      END
    );
    updater_id := COALESCE(
      try_cast_uuid(payload->>'updated_by'),
      CASE WHEN payload ? 'user' AND payload->'user' ? 'username'
        THEN cork_status.ensure_user(payload->'user'->>'username')
        ELSE NULL 
      END
    );

    INSERT INTO cork_status.service (name, title, tags, created_by, updated_by)
    VALUES (
      payload->>'name',
      payload->>'title',
      tags,
      creator_id, 
      updater_id
    ) RETURNING service_id INTO sid;

    role_name := NULLIF(TRIM(payload->>'role'), '');
    IF role_name IS NOT NULL THEN
      rid := cork_status.get_role_id(role_name);
      IF rid IS NOT NULL THEN
        INSERT INTO cork_status.service_role (service_id, role_id)
        VALUES (sid, rid)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    FOR prop IN 
      SELECT * FROM jsonb_array_elements(coalesce(payload->'service_properties','[]'::jsonb))
    LOOP

    sprop := try_cast_uuid(prop->>'service_property_id');

    IF sprop IS NULL THEN
      sprop := cork_status.ensure_service_property(prop->>'name');
    END IF;

    IF sprop IS NULL THEN
    RAISE EXCEPTION 'Unknown service_property (id/name): %', prop::text
      USING HINT = 'Provide service_property_id or an existing property name';
    END IF;

    role_name := NULLIF(TRIM(prop->>'role'), '');
    IF role_name IS NOT NULL THEN
      rid := cork_status.get_role_id(role_name);
      IF rid IS NOT NULL THEN
        INSERT INTO cork_status.service_property_role (service_property_id, role_id)
        VALUES (sprop, rid)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;


    ord := 0;
    FOR val IN 
      SELECT * FROM jsonb_array_elements(COALESCE(prop->'values','[]'::jsonb))

    LOOP
      ord := ord + 1;
      INSERT INTO cork_status.service_property_value (service_id, service_property_id, value, service_property_value_order)
      VALUES (sid, sprop, COALESCE(val->'value',val), COALESCE((val->>'order')::int, ord - 1));
    END LOOP;

  END LOOP;

  RETURN sid;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION api.create_service(payload jsonb)
  RETURNS uuid
  LANGUAGE sql
  SET search_path = pg_catalog, public, cork_status
  AS $$
    SELECT cork_status.create_service($1);
  $$;




CREATE OR REPLACE FUNCTION cork_status.update_service(payload jsonb)
  RETURNS UUID AS $$
  DECLARE 
    sid UUID;
    prop jsonb;
    val jsonb;
    sprop UUID;
    ord int;
    v_tags text[];
    role_name text;
    rid uuid;
    creator_id uuid;
    updater_id uuid;

  BEGIN 
    sid := COALESCE(
      try_cast_uuid(NULLIF(TRIM(payload->>'service_id'), '')),
      cork_status.get_service_id(NULLIF(TRIM(payload->>'name'), ''))
    );

    IF sid IS NULL THEN
      RAISE EXCEPTION 'Unknown service (service_id/name) in payload: %', payload::text;
    END IF;

    IF payload ? 'tags' THEN
      SELECT COALESCE(ARRAY_AGG(t), '{}')::text[]
      INTO v_tags
      FROM jsonb_array_elements_text(COALESCE(payload->'tags', '[]'::jsonb)) as t;
    END IF;

    updater_id := COALESCE(
      try_cast_uuid(payload->>'updated_by'),
      CASE WHEN payload ? 'user' AND payload->'user' ? 'username'
      THEN cork_status.ensure_user(payload->'user'->>'username')
      ELSE NULL
      END
    );

    UPDATE cork_status.service s
    SET
      name = COALESCE(NULLIF(TRIM(payload->>'name'),''), s.name),
      title = COALESCE(NULLIF(TRIM(payload->>'title'), ''), s.title),
      tags = COALESCE(v_tags, s.tags),
      updated_by = COALESCE(updater_id, s.updated_by),
      updated_at = now()
    WHERE service_id = sid;

    IF payload ? 'role' THEN 
      IF jsonb_typeof(payload->'role') = 'string' THEN
        role_name := NULLIF(TRIM(payload->>'role'), '');
        IF role_name IS NULL THEN
          DELETE FROM cork_status.service_role WHERE service_id = sid;
        ELSE
          rid := cork_status.get_role_id(role_name);
          IF rid IS NOT NULL THEN
            DELETE FROM cork_status.service_role WHERE service_id = sid;  -- replace
            INSERT INTO cork_status.service_role (service_id, role_id)
            VALUES (sid, rid) ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      ELSE
        -- non-string (e.g. boolean/null) => clear
        DELETE FROM cork_status.service_role WHERE service_id = sid;
      END IF;
    END IF;

    FOR prop IN 
      SELECT * FROM jsonb_array_elements(COALESCE(payload->'service_properties', '[]'::jsonb))
    LOOP

      sprop := COALESCE(try_cast_uuid(prop->>'service_property_id'), 
                        cork_status.ensure_service_property(prop->>'name')
                      );

      IF sprop IS NULL THEN
      RAISE EXCEPTION 'Unknown service_property (id/name): %', prop::text
        USING HINT = 'Provide service_property_id or an existing property name';
      END IF;

      IF prop ? 'role' THEN
        IF jsonb_typeof(prop->'role') = 'string' THEN
          role_name := NULLIF(TRIM(prop->>'role'), '');
          IF role_name IS NULL THEN
            DELETE FROM cork_status.service_property_role WHERE service_property_id = sprop;
          ELSE
            rid := cork_status.get_role_id(role_name);
            IF rid IS NOT NULL THEN
              DELETE FROM cork_status.service_property_role WHERE service_property_id = sprop;
              INSERT INTO cork_status.service_property_role (service_property_id, role_id)
              VALUES (sprop, rid) ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        ELSE
          DELETE FROM cork_status.service_property_role WHERE service_property_id = sprop;
        END IF;
      END IF;

      DELETE FROM cork_status.service_property_value
        WHERE service_id = sid AND service_property_id = sprop;

      ord := 0;
      FOR val IN 
        SELECT * FROM jsonb_array_elements(COALESCE(prop->'values', '[]'::jsonb))
      LOOP
        ord := ord + 1;
        INSERT INTO cork_status.service_property_value (service_id, service_property_id, value, service_property_value_order)
        VALUES (sid, sprop, COALESCE(val->'value', val), COALESCE((val->>'order')::int, ord - 1));
      END LOOP;
    END LOOP;

    RETURN sid;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.update_service(payload jsonb)
  RETURNS uuid
  LANGUAGE sql
  SET search_path = pg_catalog, public, cork_status
  AS $$
    SELECT cork_status.update_service($1);
  $$;





CREATE TABLE IF NOT EXISTS cork_status.service_role (
  service_id UUID REFERENCES cork_status.service(service_id) ON DELETE CASCADE,
  role_id UUID REFERENCES cork_status.role(role_id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, role_id)
);
