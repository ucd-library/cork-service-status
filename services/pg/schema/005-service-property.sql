set search_path to cork_status, public;

CREATE TABLE IF NOT EXISTS cork_status.service_property (
  service_property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text NOT NULL UNIQUE,
  description text,
  type text NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'object', 'array')),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  created_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL
);

CREATE OR REPLACE TRIGGER service_property_updated_trigger
  BEFORE UPDATE ON cork_status.service_property
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cork_status.get_service_property_id(name_or_id text)
  RETURNS UUID AS $$
  DECLARE
    oid UUID;
  BEGIN
    SELECT service_property_id INTO oid FROM cork_status.service_property
    WHERE name = name_or_id OR service_property_id=try_cast_uuid(name_or_id);
    IF oid IS NULL THEN
      RAISE EXCEPTION 'Service property not found: %', name_or_id;
    END IF;
    RETURN oid;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cork_status.ensure_service_property(name_in text)
  RETURNS UUID AS $$
  DECLARE
    spid UUID;
  BEGIN
    SELECT service_property_id INTO spid FROM cork_status.service_property WHERE name = name_in;
    IF spid IS NULL THEN
      INSERT INTO cork_status.service_property (name, title) VALUES (name_in, name_in) RETURNING service_property_id INTO spid;
    END IF;
    RETURN spid;
  END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS cork_status.service_property_value (
  service_id UUID REFERENCES cork_status.service(service_id) ON DELETE CASCADE,
  service_property_id UUID REFERENCES cork_status.service_property(service_property_id) ON DELETE CASCADE,
  value text NOT NULL,
  role_id UUID REFERENCES cork_status.role(role_id) ON DELETE SET NULL,
  PRIMARY KEY (service_id, service_property_id)
);



