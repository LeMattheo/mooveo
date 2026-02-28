-- Corrige "Database error saving new user" : met à jour le trigger de création de profil
-- À exécuter dans Supabase → SQL Editor → New query → Run

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  base_username := COALESCE(NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''), 'user');
  final_username := base_username || '_' || substr(REPLACE(NEW.id::text, '-', ''), 1, 8);

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
