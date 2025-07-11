-- *******
-- NON-PUBLIC FULL SERVICE VIEW
-- ********
CREATE OR REPLACE VIEW api.service_view_full AS
SELECT
  s.*,
  COALESCE(sp_json.service_properties, '[]') AS service_properties,
  COALESCE(last_event.event_type, 'up') AS service_status,
  COALESCE(down_event_count.p24_outage_ct, 0) AS p24_outage_ct
FROM cork_status.service s

-- Aggregate service_properties JSON structure
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object(
      'name', sp.name,
      'values', vals.values
    )
  ) AS service_properties
  FROM (
    SELECT
      spv.service_property_id,
      json_agg(
        json_build_object(
          'id', spv.service_property_value_id,
          'value', spv.value
        )
        ORDER BY spv.service_property_value_order
      ) AS values
    FROM cork_status.service_property_value spv
    WHERE spv.service_id = s.service_id
    GROUP BY spv.service_property_id
  ) vals
  JOIN cork_status.service_property sp ON sp.service_property_id = vals.service_property_id
) sp_json ON true

-- Latest event for status
LEFT JOIN LATERAL (
  SELECT e.event_type
  FROM cork_status.event e
  WHERE e.service_id = s.service_id
  ORDER BY e.created_at DESC
  LIMIT 1
) last_event ON true

-- Down events in past 24 hours
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS p24_outage_ct
  FROM cork_status.event e
  WHERE e.service_id = s.service_id
    AND e.event_type = 'down'
    AND e.created_at >= now() - interval '24 hours'
) down_event_count ON true;

-- *******
-- FULL PUBLIC SERVICE VIEW
-- *******
CREATE OR REPLACE VIEW api.service_view_full_public AS
SELECT
  s.*,
  COALESCE(sp_json.service_properties, '[]') AS service_properties,
  COALESCE(last_event.event_type, 'up') AS service_status,
  COALESCE(down_event_count.p24_outage_ct, 0) AS p24_outage_ct
FROM cork_status.service s

-- Filter to services with the 'public' role
JOIN cork_status.service_role sr ON sr.service_id = s.service_id
JOIN cork_status.role r ON r.role_id = sr.role_id AND r.name = 'public'

-- Aggregate public properties
LEFT JOIN LATERAL (
  SELECT json_agg(
    json_build_object(
      'name', sp.name,
      'values', vals.values
    )
  ) AS service_properties
  FROM (
    SELECT
      spv.service_property_id,
      json_agg(
        json_build_object(
          'id', spv.service_property_value_id,
          'value', spv.value
        )
        ORDER BY spv.service_property_value_order
      ) AS values
    FROM cork_status.service_property_value spv
    JOIN cork_status.service_property_role spr ON spr.service_property_id = spv.service_property_id
    JOIN cork_status.role r2 ON r2.role_id = spr.role_id AND r2.name = 'public'
    WHERE spv.service_id = s.service_id
    GROUP BY spv.service_property_id
  ) vals
  JOIN cork_status.service_property sp ON sp.service_property_id = vals.service_property_id
) sp_json ON true

-- Latest event for status
LEFT JOIN LATERAL (
  SELECT e.event_type
  FROM cork_status.event e
  WHERE e.service_id = s.service_id
  ORDER BY e.created_at DESC
  LIMIT 1
) last_event ON true

-- Down events in past 24 hours
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS p24_outage_ct
  FROM cork_status.event e
  WHERE e.service_id = s.service_id
    AND e.event_type = 'down'
    AND e.created_at >= now() - interval '24 hours'
) down_event_count ON true;


-- *******
-- BRIEF SERVICE VIEW
-- ********
CREATE OR REPLACE FUNCTION cork_status.filter_properties_by_name(
  properties json,
  allowed_names text[]
)
RETURNS json AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT json_agg(p)
      FROM json_array_elements(properties) AS p
      WHERE p->>'name' = ANY (allowed_names)
    ),
    '[]'::json
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW api.service_view_brief AS
SELECT
  s.service_id,
  s.name,
  s.title,
  s.tags,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by,
  s.service_status,
  s.p24_outage_ct,
  cork_status.filter_properties_by_name(s.service_properties, ARRAY[
    'url', 'is_dev'
  ]) AS service_properties
FROM api.service_view_full s;


CREATE OR REPLACE VIEW api.service_view_brief_public AS
SELECT
  s.service_id,
  s.name,
  s.title,
  s.tags,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by,
  s.service_status,
  s.p24_outage_ct,
  cork_status.filter_properties_by_name(s.service_properties, ARRAY[
    'url', 'is_dev'
  ]) AS service_properties
FROM api.service_view_full_public s;
