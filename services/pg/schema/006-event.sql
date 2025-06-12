set search_path to cork_status, api, public;

DO $$ BEGIN
  CREATE TYPE cork_status.event_type AS ENUM (
    'down',
    'up'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cork_status.event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES cork_status.service(service_id) ON DELETE CASCADE,
  event_type cork_status.event_type NOT NULL,
  event_payload jsonb,
  submitted_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cork_status.event_annotation (
  event_annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES cork_status.event(event_id) ON DELETE CASCADE,
  annotation text NOT NULL,
  created_by UUID REFERENCES cork_status.user(user_id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
