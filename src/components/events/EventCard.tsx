import Link from "next/link";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface EventCardProps {
  id: string;
  title: string;
  sport: Sport | string;
  level: string | null;
  event_date: string;
  meeting_name: string;
  distance_km: number | null;
  participants_count: number;
  max_participants: number;
  organizer_username: string | null;
}

export function EventCard({
  id,
  title,
  sport,
  level,
  event_date,
  meeting_name,
  distance_km,
  participants_count,
  max_participants,
  organizer_username,
}: EventCardProps) {
  const emoji = sport in SPORT_EMOJI ? SPORT_EMOJI[sport as Sport] : "📍";
  const date = new Date(event_date);

  return (
    <Link
      href={`/events/${id}`}
      className="card block hover:border-emerald-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="text-sm text-gray-500">
          {participants_count}/{max_participants} participants
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mt-1">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">
        {format(date, "EEEE d MMMM à HH:mm", { locale: fr })}
      </p>
      <p className="text-sm text-gray-500">📍 {meeting_name}</p>
      {distance_km != null && (
        <p className="text-sm text-gray-500">À {distance_km} km</p>
      )}
      {level && level !== "tous niveaux" && (
        <p className="text-xs text-gray-400 mt-1">Niveau : {level}</p>
      )}
      {organizer_username && (
        <p className="text-xs text-gray-400 mt-1">Par {organizer_username}</p>
      )}
    </Link>
  );
}
