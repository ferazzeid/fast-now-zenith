-- Clean up the content_rotation_data field which still has \n characters
UPDATE fasting_hours 
SET content_rotation_data = jsonb_set(
  content_rotation_data,
  '{variants}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        variant,
        '{content}',
        to_jsonb(REPLACE(REPLACE(variant->>'content', '\n', ' '), '\\n', ' '))
      )
    )
    FROM jsonb_array_elements(content_rotation_data->'variants') AS variant
  )
)
WHERE content_rotation_data IS NOT NULL 
  AND content_rotation_data->'variants' IS NOT NULL;