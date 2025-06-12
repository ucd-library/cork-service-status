-- *******
-- NON-PUBLIC SERVICE VIEW
-- ********
CREATE OR REPLACE VIEW api.service_full_view AS
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
-- PUBLIC SERVICE VIEW
-- *******
CREATE OR REPLACE VIEW api.service_public_view AS
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
