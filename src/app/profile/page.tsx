import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { HistoryList } from "@/components/profile/HistoryList";
import { StatsPanel } from "@/components/profile/StatsPanel";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import type { Sport } from "@/types";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab ?? "profile";

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, level, home_lat, home_lon, home_display_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: sports } = await supabase
    .from("profile_sports")
    .select("sport")
    .eq("profile_id", user.id);

  const sportsList = (sports ?? []).map((s) => s.sport as Sport);

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <Link
        href="/events"
        className="text-emerald-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Retour aux sorties
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Mon profil</h1>

      <ProfileTabs basePath="/profile" />

      {tab === "profile" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xl">
                {(profile?.full_name || profile?.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-800">
                {profile?.full_name || "—"}
              </p>
              <p className="text-sm text-slate-500">@{profile?.username}</p>
            </div>
          </div>
          {profile?.bio && (
            <p>
              <span className="text-gray-500">Bio :</span> {profile.bio}
            </p>
          )}
          {profile?.level && (
            <p>
              <span className="text-gray-500">Niveau :</span> {profile.level}
            </p>
          )}
          {sportsList.length > 0 && (
            <p>
              <span className="text-gray-500">Sports :</span>{" "}
              {sportsList.join(", ")}
            </p>
          )}
          {(profile?.home_display_name || (profile?.home_lat != null && profile?.home_lon != null)) && (
            <p>
              <span className="text-gray-500">Position :</span>{" "}
              {profile?.home_display_name ?? `${profile?.home_lat?.toFixed(4)}, ${profile?.home_lon?.toFixed(4)}`}
            </p>
          )}
          {(!profile?.home_lat || !profile?.home_lon) && (
            <p className="text-amber-600 text-sm">
              Complète ta position dans Paramètres pour voir les sorties et partenaires près de chez toi.
            </p>
          )}
        </div>
      )}

      {tab === "history" && <HistoryList userId={user.id} />}
      {tab === "stats" && <StatsPanel userId={user.id} />}
      {tab === "settings" && (
        <ProfileSettingsForm
          initial={{
            full_name: profile?.full_name ?? null,
            bio: profile?.bio ?? null,
            level: profile?.level ?? null,
            home_lat: profile?.home_lat ?? null,
            home_lon: profile?.home_lon ?? null,
            home_display_name: profile?.home_display_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            sports: sportsList,
          }}
        />
      )}
    </main>
  );
}
