import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, level, home_lat, home_lon")
    .eq("id", user.id)
    .single();

  const { data: sports } = await supabase
    .from("profile_sports")
    .select("sport")
    .eq("profile_id", user.id);

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <Link href="/events" className="text-emerald-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux sorties
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Mon profil</h1>
      <div className="card space-y-2">
        <p><span className="text-gray-500">Nom :</span> {profile?.full_name || "—"}</p>
        <p><span className="text-gray-500">Username :</span> {profile?.username}</p>
        {profile?.bio && <p><span className="text-gray-500">Bio :</span> {profile.bio}</p>}
        {profile?.level && <p><span className="text-gray-500">Niveau :</span> {profile.level}</p>}
        {sports && sports.length > 0 && (
          <p><span className="text-gray-500">Sports :</span> {sports.map((s) => s.sport).join(", ")}</p>
        )}
      </div>
    </main>
  );
}
