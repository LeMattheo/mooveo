"use client";

import Link from "next/link";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface EventForPopup {
  id: string;
  title: string;
  sport: string;
  level: string | null;
  event_date: string;
  meeting_name: string;
  distance_km: number | null;
  participants_count: number;
  max_participants: number;
}

interface EventMarkerPopupProps {
  event: EventForPopup;
}

export function EventMarkerPopup({ event }: EventMarkerPopupProps) {
  const emoji = event.sport in SPORT_EMOJI ? SPORT_EMOJI[event.sport as Sport] : "📍";
  const date = new Date(event.event_date);

  return (
    <div className="min-w-[200px] p-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{emoji}</span>
        <span className="font-semibold text-slate-800">{event.title}</span>
      </div>
      <p className="text-sm text-slate-600">
        {format(date, "EEEE d MMMM à HH:mm", { locale: fr })}
      </p>
      <p className="text-sm text-slate-500">📍 {event.meeting_name}</p>
      {event.distance_km != null && (
        <p className="text-sm text-slate-500">À {event.distance_km} km</p>
      )}
      <p className="text-xs text-slate-400">
        {event.participants_count}/{event.max_participants} participants
      </p>
      {event.level && event.level !== "tous niveaux" && (
        <p className="text-xs text-slate-400">Niveau : {event.level}</p>
      )}
      <Link
        href={`/events/${event.id}`}
        className="btn-primary inline-block mt-2 text-center text-sm py-2"
      >
        Voir la sortie
      </Link>
    </div>
  );
}
