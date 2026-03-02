-- Adresse lisible associée à la position (remplit automatiquement à partir des coordonnées)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_display_name TEXT;
