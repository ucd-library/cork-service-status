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

CREATE OR REPLACE FUNCTION api.process_gcloud_uptime_alert(payload JSONB)
RETURNS VOID AS $$
DECLARE
    host TEXT;
    service_id UUID;
    event_type TEXT;
BEGIN
    -- Extract host from payload
    host := payload #>> '{incident,resource,labels,host}';

    IF host IS NULL THEN
        RAISE EXCEPTION 'No host found in payload: %', payload
        USING ERRCODE = 'P0001';
    END IF;

    -- Try to resolve service_id using matching service_property values
    SELECT spv.service_id INTO service_id
    FROM cork_status.service_property_value spv
    JOIN cork_status.service_property sp ON sp.service_property_id = spv.service_property_id
    WHERE sp.name IN ('url', 'admin_url')
      AND spv.value::text ILIKE '%' || host || '%'
    LIMIT 1;

    IF service_id IS NULL THEN
        RAISE EXCEPTION 'No matching service found for host: %', host
        USING ERRCODE = 'P0001';
    END IF;

    -- Extract state to determine event type
    event_type := payload #>> '{incident,state}';

    IF event_type IS NULL THEN
        RAISE EXCEPTION 'No event_type/state found in payload.'
        USING ERRCODE = 'P0001';
    END IF;

    -- Normalize event_type
    IF LOWER(event_type) = 'open' THEN
        event_type := 'down';
    ELSIF LOWER(event_type) = 'closed' THEN
        event_type := 'up';
    ELSE
        RAISE EXCEPTION 'Unknown event_type/state: %', event_type
        USING ERRCODE = 'P0001';
    END IF;

    -- Insert the event
    INSERT INTO cork_status.event (service_id, event_type, event_payload)
    VALUES (service_id, event_type::cork_status.event_type, payload);

END;
$$ LANGUAGE plpgsql;
