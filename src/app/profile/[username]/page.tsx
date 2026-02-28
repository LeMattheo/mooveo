import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, level, avatar_url")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const { data: sportsList } = await supabase
    .from("profile_sports")
    .select("sport")
    .eq("profile_id", profile.id);

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <Link href="/events" className="text-emerald-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux sorties
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        {profile.full_name || profile.username}
      </h1>
      <div className="card space-y-2">
        {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
        {profile.level && <p><span className="text-gray-500">Niveau :</span> {profile.level}</p>}
        {sportsList && sportsList.length > 0 && (
          <p><span className="text-gray-500">Sports :</span> {sportsList.map((s) => s.sport).join(", ")}</p>
        )}
      </div>
    </main>
  );
}
