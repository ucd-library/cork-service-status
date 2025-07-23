set search_path to cork_status, api, public;

-- Function to insert uptime events with better error handling
CREATE OR REPLACE FUNCTION cork_status.insert_uptime_event(
  p_service_id UUID,
  p_event_type cork_status.event_type,
  p_event_payload jsonb
)
RETURNS TABLE (
  event_id UUID,
  service_id UUID,
  event_type cork_status.event_type,
  created_at timestamp
) AS $$
DECLARE
  v_event_id UUID;
  v_service_exists boolean;
BEGIN
  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM cork_status.service s WHERE s.service_id = p_service_id
  ) INTO v_service_exists;
  
  IF NOT v_service_exists THEN
    RAISE EXCEPTION 'Service with ID % does not exist', p_service_id;
  END IF;
  
  -- Insert the event
  INSERT INTO cork_status.event (service_id, event_type, event_payload)
  VALUES (p_service_id, p_event_type, p_event_payload)
  RETURNING cork_status.event.event_id, cork_status.event.created_at INTO v_event_id, created_at;
  
  -- Return the inserted event details
  RETURN QUERY
  SELECT v_event_id, p_service_id, p_event_type, created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to find service by URL or resource name
CREATE OR REPLACE FUNCTION cork_status.find_service_by_resource(
  p_resource_name text,
  p_url text DEFAULT NULL
)
RETURNS TABLE (
  service_id UUID,
  name text,
  title text,
  match_reason text
) AS $$
BEGIN
  -- First try to match by service name
  RETURN QUERY
  SELECT s.service_id, s.name, s.title, 'name_match' as match_reason
  FROM cork_status.service s
  WHERE s.name = p_resource_name
  LIMIT 1;
  
  -- If no match and URL provided, try to match by URL property
  IF NOT FOUND AND p_url IS NOT NULL THEN
    RETURN QUERY
    SELECT s.service_id, s.name, s.title, 'url_match' as match_reason
    FROM cork_status.service s
    JOIN cork_status.service_property_value spv ON spv.service_id = s.service_id
    JOIN cork_status.service_property sp ON sp.service_property_id = spv.service_property_id
    WHERE sp.name = 'url' AND spv.value = p_url
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get service status summary
CREATE OR REPLACE FUNCTION cork_status.get_service_status_summary()
RETURNS TABLE (
  total_services bigint,
  services_up bigint,
  services_down bigint,
  recent_events_24h bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.service_id) as total_services,
    COUNT(DISTINCT CASE WHEN COALESCE(last_event.event_type, 'up') = 'up' THEN s.service_id END) as services_up,
    COUNT(DISTINCT CASE WHEN COALESCE(last_event.event_type, 'up') = 'down' THEN s.service_id END) as services_down,
    COUNT(e24h.event_id) as recent_events_24h
  FROM cork_status.service s
  LEFT JOIN LATERAL (
    SELECT e.event_type
    FROM cork_status.event e
    WHERE e.service_id = s.service_id
    ORDER BY e.created_at DESC
    LIMIT 1
  ) last_event ON true
  LEFT JOIN cork_status.event e24h ON e24h.service_id = s.service_id 
    AND e24h.created_at >= now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;