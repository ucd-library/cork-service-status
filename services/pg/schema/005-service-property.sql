set search_path to cork_status, api, public;

CREATE TABLE IF NOT EXISTS cork_status.service_property (
  service_property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text NOT NULL UNIQUE,
  description text,
  type text NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'object', 'array', 'markdown', 'date')),
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

CREATE TABLE IF NOT EXISTS cork_status.service_property_role (
  service_property_id UUID REFERENCES cork_status.service_property(service_property_id) ON DELETE CASCADE,
  role_id UUID REFERENCES cork_status.role(role_id) ON DELETE CASCADE,
  PRIMARY KEY (service_property_id, role_id)
);

CREATE TABLE IF NOT EXISTS cork_status.service_property_value (
  service_property_value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES cork_status.service(service_id) ON DELETE CASCADE,
  service_property_id UUID REFERENCES cork_status.service_property(service_property_id) ON DELETE CASCADE,
  value text NOT NULL,
  service_property_value_order integer NOT NULL DEFAULT 0
);

INSERT INTO cork_status.service_property (name, title, description, type)
VALUES
  ('is_dev', 'Development Service', 'Service is for development purposes only', 'boolean'),
  ('url', 'Service URL', 'Primary URL for the service', 'string'),
  ('admin_url', 'Service Admin URL', 'URL for service administration', 'string'),
  ('technical_lead', 'Technical Lead', 'Responsible for service health and restarts', 'string'),
  ('technical_lead_backup', 'Backup Technical lead', 'For when the technical lead is unavailable', 'string'),
  ('support_url', 'Support URL', 'URL for service support resources', 'string'),
  ('health_dashboard', 'Health Dashboard', 'URL for the Google Cloud health dashboard', 'string'),
  ('restart_instructions', 'Restart Instructions', 'Instructions for restarting the service', 'markdown')
ON CONFLICT (name) DO NOTHING;



