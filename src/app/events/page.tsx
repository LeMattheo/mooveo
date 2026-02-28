import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCard } from "@/components/events/EventCard";

interface PageProps {
  searchParams: Promise<{ sport?: string; level?: string; radius?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sportFilter = params.sport ?? null;
  const levelFilter = params.level ?? null;
  const radiusKm = Math.min(100, Math.max(10, parseInt(params.radius ?? "25", 10) || 25));

  const { data: profile } = await supabase.from("profiles").select("home_lat, home_lon").eq("id", user.id).single();
  const userLat = profile?.home_lat ?? 45.75;
  const userLon = profile?.home_lon ?? 4.85;

  const dateFrom = new Date().toISOString();
  const dateTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await supabase.rpc("search_events_nearby", {
    user_lat: userLat,
    user_lon: userLon,
    radius_km: radiusKm,
    sport_filter: sportFilter,
    level_filter: levelFilter,
    date_from: dateFrom,
    date_to: dateTo,
  });

  const list = (events ?? []) as Array<{
    id: string;
    title: string;
    sport: string;
    level: string | null;
    event_date: string;
    meeting_name: string;
    meeting_lat: number;
    meeting_lon: number;
    distance_m: number;
    participants_count: number;
    max_participants: number;
    organizer_username: string | null;
    distance_km: number | null;
  }>;

  return (
    <main>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Sorties près de chez toi</h1>

      <EventFilters />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <p className="text-slate-600 text-sm">
          {list.length} sortie{list.length !== 1 ? "s" : ""} trouvée{list.length !== 1 ? "s" : ""}
        </p>
        <Link href="/events/new" className="btn-primary">
          Créer une sortie
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => (
          <EventCard
            key={e.id}
            id={e.id}
            title={e.title}
            sport={e.sport}
            level={e.level}
            event_date={e.event_date}
            meeting_name={e.meeting_name}
            distance_km={e.distance_km ?? null}
            participants_count={Number(e.participants_count)}
            max_participants={e.max_participants}
            organizer_username={e.organizer_username}
          />
        ))}
      </div>

      {list.length === 0 && !error && (
        <div className="card text-center py-12">
          <p className="text-slate-600 mb-4">Aucune sortie dans ce rayon.</p>
          <Link href="/events/new" className="btn-primary inline-block">
            Créer la première sortie
          </Link>
        </div>
      )}
    </main>
  );
}
