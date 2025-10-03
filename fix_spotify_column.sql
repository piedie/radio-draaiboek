-- Voeg ontbrekende kolom toe aan items tabel
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS spotify_preview_url TEXT;

-- Update eventuele NULL waarden naar lege string voor consistentie
UPDATE items 
SET spotify_preview_url = '' 
WHERE spotify_preview_url IS NULL;
