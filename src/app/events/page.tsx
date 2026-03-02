import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFilters } from "@/components/events/EventFilters";
import { SearchBar } from "@/components/events/SearchBar";
import { EventsPageClient } from "./EventsPageClient";

interface PageProps {
  searchParams: Promise<{
    sport?: string;
    level?: string;
    radius?: string;
    q?: string;
    view?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sportFilter = params.sport ?? null;
  const levelFilter = params.level ?? null;
  const radiusKm = Math.min(
    100,
    Math.max(10, parseInt(params.radius ?? "25", 10) || 25)
  );
  const searchQuery = params.q?.trim() || null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_lat, home_lon")
    .eq("id", user.id)
    .single();

  const hasPosition = profile?.home_lat != null && profile?.home_lon != null;
  const userLat = profile?.home_lat ?? 46.6;
  const userLon = profile?.home_lon ?? 1.88;

  const effectiveRadiusKm = hasPosition
    ? radiusKm
    : Math.max(radiusKm, 300);

  const dateFrom = new Date().toISOString();
  const dateTo = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: events, error } = await supabase.rpc("search_events", {
    user_lat: userLat,
    user_lon: userLon,
    radius_km: effectiveRadiusKm,
    sport_filter: sportFilter,
    level_filter: levelFilter,
    date_from: dateFrom,
    date_to: dateTo,
    search_query: searchQuery,
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
    distance_km: number | null;
    participants_count: number;
    max_participants: number;
    organizer_username: string | null;
  }>;

  return (
    <main>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Sorties près de chez toi
      </h1>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <SearchBar />
      </div>
      <EventFilters />

      {searchQuery && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">
            Recherche : {searchQuery}
            <Link
              href={(() => {
                const p = new URLSearchParams();
                if (params.sport) p.set("sport", params.sport);
                if (params.level) p.set("level", params.level);
                if (params.radius) p.set("radius", params.radius);
                if (params.view) p.set("view", params.view);
                const s = p.toString();
                return s ? `/events?${s}` : "/events";
              })()}
              className="hover:bg-slate-300 rounded-full p-0.5"
              aria-label="Effacer la recherche"
            >
              ×
            </Link>
          </span>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <p className="text-slate-600 text-sm">
          {list.length} sortie{list.length !== 1 ? "s" : ""} trouvée
          {list.length !== 1 ? "s" : ""} dans un rayon de {effectiveRadiusKm} km
          {!hasPosition && (
            <span className="block mt-1 text-amber-600">
              <Link href="/profile?tab=settings" className="underline hover:no-underline">
                Complète ta position dans Paramètres
              </Link>
              {" "}pour voir les sorties près de chez toi.
            </span>
          )}
        </p>
        <Link href="/events/new" className="btn-primary">
          Créer une sortie
        </Link>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error.message}</p>
      )}

      {list.length === 0 && !error && (
        <div className="card text-center py-8 mb-6">
          <p className="text-slate-600 mb-4">
            Aucune sortie trouvée. Élargis le rayon, change les filtres ou
            parcours la carte pour voir la zone.
          </p>
          <Link href="/events/new" className="btn-primary inline-block">
            Créer une sortie
          </Link>
        </div>
      )}

      <EventsPageClient
        events={list}
        userLat={userLat}
        userLon={userLon}
        radiusKm={radiusKm}
      />
    </main>
  );
}
