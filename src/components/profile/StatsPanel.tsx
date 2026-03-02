"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";
import { format, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

interface UserStatsRow {
  user_id: string;
  events_organized: number;
  events_joined: number;
  total_events: number;
  total_distance_km: number;
  favorite_sport: string | null;
  next_event_date: string | null;
}

interface HistoryEntry {
  event_date: string;
  sport: string;
}

interface StatsPanelProps {
  userId: string;
}

const MONTHS = 6;
const BAR_COLORS = ["#10b981", "#6366f1", "#f59e0b"];

export function StatsPanel({ userId }: StatsPanelProps) {
  const [stats, setStats] = useState<UserStatsRow | null>(null);
  const [historyForChart, setHistoryForChart] = useState<HistoryEntry[]>([]);
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
      setStats(statsData as UserStatsRow | null);

      const { data: historyData } = await supabase.rpc("get_user_event_history", {
        target_user_id: userId,
        page_size: 100,
        page_offset: 0,
      });
      const list = (historyData ?? []) as HistoryEntry[];
      setHistoryForChart(list);

      const counts: Record<string, number> = {};
      list.forEach((e) => {
        counts[e.sport] = (counts[e.sport] || 0) + 1;
      });
      setSportCounts(counts);
      setLoading(false);
    })();
  }, [userId]);

  const chartData = useMemo(() => {
    const now = new Date();
    const result: { month: string; sorties: number }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d).getTime();
      const count = historyForChart.filter((e) => {
        const t = new Date(e.event_date).getTime();
        return t >= start && t < start + 31 * 24 * 60 * 60 * 1000;
      }).length;
      result.push({
        month: format(d, "MMM yyyy", { locale: fr }),
        sorties: count,
      });
    }
    return result;
  }, [historyForChart]);

  const totalSport = Object.values(sportCounts).reduce((a, b) => a + b, 0);
  const sportBars = ["vélo", "course", "marche"].map((sport) => ({
    sport,
    count: sportCounts[sport] || 0,
    pct: totalSport > 0 ? Math.round(((sportCounts[sport] || 0) / totalSport) * 100) : 0,
  }));

  if (loading) {
    return (
      <div className="card py-8 text-center text-slate-500">
        Chargement des stats...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card py-8 text-center text-slate-500">
        Aucune statistique disponible.
      </div>
    );
  }

  const nextDate = stats.next_event_date
    ? new Date(stats.next_event_date)
    : null;
  const daysUntil =
    nextDate && nextDate > new Date()
      ? Math.ceil((nextDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null;

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-500">
        Stats mises à jour toutes les heures.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <span className="text-2xl">🗓️</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {Number(stats.total_events) ?? 0}
          </p>
          <p className="text-sm text-slate-600">sorties au total</p>
        </div>
        <div className="card">
          <span className="text-2xl">🏆</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {Number(stats.events_organized) ?? 0}
          </p>
          <p className="text-sm text-slate-600">sorties organisées</p>
        </div>
        <div className="card">
          <span className="text-2xl">📍</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {Number(stats.total_distance_km) ?? 0} km
          </p>
          <p className="text-sm text-slate-600">parcourus (estimés)</p>
        </div>
        <div className="card">
          <span className="text-2xl">❤️</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.favorite_sport
              ? `${stats.favorite_sport in SPORT_EMOJI ? SPORT_EMOJI[stats.favorite_sport as Sport] : ""} ${stats.favorite_sport}`
              : "—"}
          </p>
          <p className="text-sm text-slate-600">sport favori</p>
        </div>
      </div>

      {daysUntil != null && daysUntil > 0 && (
        <div className="card bg-emerald-50 border-emerald-200">
          <p className="text-emerald-800 font-medium">
            Prochaine sortie dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className="card">
        <h4 className="font-semibold text-slate-800 mb-4">
          Sorties par mois (6 derniers mois)
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sorties" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-slate-800 mb-4">
          Répartition par sport
        </h4>
        <div className="space-y-3">
          {sportBars.map(({ sport, count, pct }, i) => (
            <div key={sport}>
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {sport in SPORT_EMOJI ? SPORT_EMOJI[sport as Sport] : ""} {sport}
                </span>
                <span className="text-slate-600">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
