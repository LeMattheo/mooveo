"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import dynamic from "next/dynamic";
import type { Sport } from "@/types";

const EventsMap = dynamic(
  () => import("@/components/map/EventsMap").then((m) => m.EventsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Chargement de la carte...</span>
      </div>
    ),
  }
);

export interface EventItem {
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
}

interface EventsPageClientProps {
  events: EventItem[];
  userLat: number;
  userLon: number;
  radiusKm: number;
}

export function EventsPageClient({
  events,
  userLat,
  userLon,
  radiusKm,
}: EventsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "list";

  const setView = (v: "list" | "map") => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("view", v);
    router.push(`/events?${next.toString()}`);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            view === "list"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Liste
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            view === "map"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Carte
        </button>
      </div>

      {view === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              id={e.id}
              title={e.title}
              sport={e.sport as Sport}
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
      )}

      {view === "map" && (
        <EventsMap
          events={events}
          userLat={userLat}
          userLon={userLon}
          radiusKm={radiusKm}
        />
      )}
    </>
  );
}
