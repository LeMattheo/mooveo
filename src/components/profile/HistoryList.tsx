"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

interface HistoryEntry {
  id: string;
  title: string;
  sport: string;
  level: string | null;
  event_date: string;
  meeting_name: string;
  distance_km: number | null;
  role: string;
  participants_count: number;
}

interface HistoryListProps {
  userId: string;
  pageSize?: number;
}

export function HistoryList({ userId, pageSize = 10 }: HistoryListProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async (pageOffset: number, append: boolean) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_user_event_history", {
      target_user_id: userId,
      page_size: pageSize,
      page_offset: pageOffset,
    });
    if (error) {
      setHasMore(false);
      return;
    }
    const list = (data ?? []) as HistoryEntry[];
    setEntries((prev) => (append ? [...prev, ...list] : list));
    setHasMore(list.length === pageSize);
    setLoading(false);
  };

  useEffect(() => {
    load(0, false);
  }, [userId]);

  const loadMore = () => {
    const next = offset + pageSize;
    setOffset(next);
    load(next, true);
  };

  if (loading) {
    return (
      <div className="card py-8 text-center text-slate-500">
        Chargement de l&apos;historique...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-600 mb-4">
          Vous n&apos;avez pas encore participé à de sortie. Trouvez votre première sortie →
        </p>
        <Link href="/events" className="btn-primary inline-block">
          Voir les sorties
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((e) => {
        const emoji = e.sport in SPORT_EMOJI ? SPORT_EMOJI[e.sport as Sport] : "📍";
        const date = new Date(e.event_date);
        return (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="card block hover:border-emerald-300 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xl">{emoji}</span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  e.role === "organizer"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {e.role === "organizer" ? "🟢 Organisateur" : "🔵 Participant"}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mt-1">{e.title}</h3>
            <p className="text-sm text-gray-600">
              {format(date, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
            <p className="text-sm text-gray-500">📍 {e.meeting_name}</p>
            {e.distance_km != null && (
              <p className="text-sm text-gray-500">À {e.distance_km} km</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {e.participants_count} participant{e.participants_count !== 1 ? "s" : ""}
            </p>
          </Link>
        );
      })}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={loadMore}
            className="btn-secondary"
          >
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
