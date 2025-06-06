set search_path to cork_status, public;

CREATE TABLE IF NOT EXISTS cork_status.role (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER role_updated_trigger
  BEFORE UPDATE ON cork_status.role
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cork_status.get_role_id(name_or_id text)
  RETURNS UUID AS $$
  DECLARE
    oid UUID;
  BEGIN
    SELECT role_id INTO oid FROM cork_status.role
    WHERE name = name_or_id OR role_id=try_cast_uuid(name_or_id);

    IF oid IS NULL THEN
      RAISE EXCEPTION 'Role not found: %', name_or_id;
    END IF;

    RETURN oid;
  END;
$$ LANGUAGE plpgsql;

-- Insert default roles
INSERT INTO cork_status.role (name)
VALUES
    ('public')
ON CONFLICT (name) DO NOTHING;
