import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { HistoryList } from "@/components/profile/HistoryList";
import { StatsPanel } from "@/components/profile/StatsPanel";
import { PartnerButton } from "@/components/partners/PartnerButton";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const search = await searchParams;
  const tab = search.tab ?? "profile";
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

  const basePath = `/profile/${encodeURIComponent(username)}`;

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <Link href="/events" className="text-emerald-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux sorties
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xl">
              {(profile.full_name || profile.username).charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">
            {profile.full_name || profile.username}
          </h1>
        </div>
        <PartnerButton addresseeId={profile.id} username={profile.username} />
      </div>

      <ProfileTabs basePath={basePath} />

      {tab === "profile" && (
        <div className="card space-y-2">
          {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
          {profile.level && (
            <p><span className="text-gray-500">Niveau :</span> {profile.level}</p>
          )}
          {sportsList && sportsList.length > 0 && (
            <p>
              <span className="text-gray-500">Sports :</span>{" "}
              {sportsList.map((s) => s.sport).join(", ")}
            </p>
          )}
        </div>
      )}

      {tab === "history" && <HistoryList userId={profile.id} />}
      {tab === "stats" && <StatsPanel userId={profile.id} />}
    </main>
  );
}
