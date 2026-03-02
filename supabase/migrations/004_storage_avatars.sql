-- Bucket pour les photos de profil (lecture publique, écriture authentifiée)
-- Si l'INSERT ci-dessous échoue : Dashboard Supabase > Storage > New bucket >
--   name: avatars, Public: oui. Puis exécuter uniquement les CREATE POLICY ci-dessous.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy : tout le monde peut lire
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy : les utilisateurs authentifiés peuvent uploader dans leur dossier (user_id/filename)
CREATE POLICY "avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy : les utilisateurs peuvent mettre à jour / supprimer leurs propres fichiers
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
