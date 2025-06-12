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

CREATE TABLE IF NOT EXISTS cork_status.service_role (
  service_id UUID REFERENCES cork_status.service(service_id) ON DELETE CASCADE,
  role_id UUID REFERENCES cork_status.role(role_id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, role_id)
);
