-- À utiliser UNIQUEMENT si tu as créé le bucket "avatars" à la main dans le Dashboard
-- (Storage > New bucket > name: avatars, Public: oui).
-- Ne pas exécuter ce fichier si tu as déjà exécuté 004_storage_avatars.sql avec succès.

-- Policy : tout le monde peut lire
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy : les utilisateurs authentifiés peuvent uploader dans leur dossier (user_id/filename)
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
CREATE POLICY "avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy : les utilisateurs peuvent mettre à jour / supprimer leurs propres fichiers
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
