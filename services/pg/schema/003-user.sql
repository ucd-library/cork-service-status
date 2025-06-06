set search_path to cork_status, public;

CREATE TABLE IF NOT EXISTS cork_status.user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER user_updated_trigger
  BEFORE UPDATE ON cork_status.user
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION cork_status.get_user_id(name_or_id text)
  RETURNS UUID AS $$
  DECLARE
    oid UUID;
  BEGIN
    SELECT user_id INTO oid FROM cork_status.user
    WHERE name = name_or_id OR user_id=try_cast_uuid(name_or_id);

    IF oid IS NULL THEN
      RAISE EXCEPTION 'User not found: %', name_or_id;
    END IF;

    RETURN oid;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cork_status.ensure_user(username_in text)
  RETURNS UUID AS $$
  DECLARE
    uid UUID;
  BEGIN
    SELECT user_id INTO uid FROM cork_status.user WHERE username = username_in;
    IF uid IS NULL THEN
      INSERT INTO cork_status.user (username) VALUES (username_in) RETURNING user_id INTO uid;
    END IF;
    RETURN uid;
  END;
$$ LANGUAGE plpgsql;
