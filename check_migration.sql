
-- 1. Controleer of user_item_types tabel bestaat en data bevat
SELECT COUNT(*) as total_item_types FROM user_item_types;

-- 2. Bekijk alle item types voor alle users
SELECT 
  user_id, 
  name, 
  display_name, 
  color, 
  default_duration, 
  is_active,
  created_at
FROM user_item_types 
ORDER BY user_id, display_name;

-- 3. Check je eigen user ID
SELECT 
  auth.uid() as current_user_id;

-- 4. Check item types voor jouw user
SELECT 
  name, 
  display_name, 
  color, 
  default_duration, 
  is_active
FROM user_item_types 
WHERE user_id = auth.uid()
ORDER BY display_name;

-- 5. Check items tabel voor user_item_type_id kolom
SELECT 
  id,
  title, 
  type,
  user_item_type_id,
  user_id
FROM items 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 6. Als query 4 geen resultaten toont, voeg standaard types toe:
INSERT INTO user_item_types (user_id, name, display_name, color, default_duration, custom_fields)
SELECT 
  auth.uid(),
  'music',
  'Muziek',
  '#ef4444',
  180,
  '[{"name": "artist", "type": "text", "label": "Artiest", "required": false}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_item_types 
  WHERE user_id = auth.uid() AND name = 'music'
);

INSERT INTO user_item_types (user_id, name, display_name, color, default_duration, custom_fields)
SELECT 
  auth.uid(),
  'talk',
  'Presentatie',
  '#22c55e',
  120,
  '[{"name": "first_words", "type": "textarea", "label": "Eerste woorden", "required": false}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_item_types 
  WHERE user_id = auth.uid() AND name = 'talk'
);

INSERT INTO user_item_types (user_id, name, display_name, color, default_duration, custom_fields)
SELECT 
  auth.uid(),
  'jingle',
  'Jingle',
  '#3b82f6',
  30,
  '[]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_item_types 
  WHERE user_id = auth.uid() AND name = 'jingle'
);

-- 7. Controleer of de standaard types nu bestaan
SELECT 
  name, 
  display_name, 
  color, 
  default_duration, 
  is_active
FROM user_item_types 
WHERE user_id = auth.uid()
ORDER BY display_name;
