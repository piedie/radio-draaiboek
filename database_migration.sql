-- Database migratie voor flexibele item-types per gebruiker
-- Voer deze SQL uit in je Supabase SQL editor

-- 1. Maak een tabel voor custom item types per gebruiker
CREATE TABLE IF NOT EXISTS user_item_types (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- bijv. "jingle", "sponsor", "weather"
  display_name VARCHAR(100) NOT NULL, -- bijv. "Jingle", "Sponsor", "Weerbericht"
  color VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- hex color
  default_duration INTEGER NOT NULL DEFAULT 180, -- seconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Custom fields configuratie (JSON)
  custom_fields JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name),
  CHECK (name ~ '^[a-z_]+$'), -- alleen lowercase en underscores
  CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 50),
  CHECK (LENGTH(display_name) >= 2 AND LENGTH(display_name) <= 100),
  CHECK (color ~ '^#[0-9a-fA-F]{6}$'), -- valid hex color
  CHECK (default_duration > 0)
);

-- 2. Maak een tabel voor item type templates (optioneel, voor quick-add)
CREATE TABLE IF NOT EXISTS item_type_templates (
  id SERIAL PRIMARY KEY,
  user_item_type_id INTEGER NOT NULL REFERENCES user_item_types(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- bijv. "Intro jingle", "Outro jingle"
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- pre-filled form data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Voeg user_item_type_id toe aan bestaande items tabel
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS user_item_type_id INTEGER REFERENCES user_item_types(id);

-- 4. Maak indexes voor performance
CREATE INDEX IF NOT EXISTS idx_user_item_types_user_id ON user_item_types(user_id);
CREATE INDEX IF NOT EXISTS idx_user_item_types_active ON user_item_types(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_type_templates_user_type ON item_type_templates(user_item_type_id);
CREATE INDEX IF NOT EXISTS idx_items_user_item_type ON items(user_item_type_id);

-- 5. RLS (Row Level Security) policies
ALTER TABLE user_item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_type_templates ENABLE ROW LEVEL SECURITY;

-- Policies voor user_item_types
CREATE POLICY "Users can view their own item types" ON user_item_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item types" ON user_item_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item types" ON user_item_types
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item types" ON user_item_types
  FOR DELETE USING (auth.uid() = user_id);

-- Policies voor item_type_templates
CREATE POLICY "Users can view their own item templates" ON item_type_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_item_types uit 
      WHERE uit.id = item_type_templates.user_item_type_id 
      AND uit.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own item templates" ON item_type_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_item_types uit 
      WHERE uit.id = item_type_templates.user_item_type_id 
      AND uit.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own item templates" ON item_type_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_item_types uit 
      WHERE uit.id = item_type_templates.user_item_type_id 
      AND uit.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own item templates" ON item_type_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_item_types uit 
      WHERE uit.id = item_type_templates.user_item_type_id 
      AND uit.user_id = auth.uid()
    )
  );

-- 6. Triggers voor updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_item_types_updated_at BEFORE UPDATE ON user_item_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_type_templates_updated_at BEFORE UPDATE ON item_type_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Seed data: Maak standaard item types voor alle bestaande gebruikers
-- (Dit is optioneel - je kunt dit ook via de app doen)

-- Voorbeelddata voor nieuwe gebruikers (je kunt dit aanpassen)
/*
INSERT INTO user_item_types (user_id, name, display_name, color, default_duration, custom_fields)
SELECT 
  auth.users.id,
  'music',
  'Muziek',
  '#ef4444',
  180,
  '[
    {"name": "artist", "type": "text", "label": "Artiest", "required": false},
    {"name": "spotify_preview_url", "type": "url", "label": "Spotify Preview", "required": false}
  ]'::jsonb
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM user_item_types 
  WHERE user_id = auth.users.id AND name = 'music'
);
*/

-- Opmerking: Bovenstaande seed data is uitgecommentarieerd
-- Voer het uit als je automatisch standaard types wilt toevoegen
