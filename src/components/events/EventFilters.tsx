"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SPORT_OPTIONS, LEVEL_OPTIONS_EVENT } from "@/types";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sport = searchParams.get("sport") ?? "";
  const level = searchParams.get("level") ?? "";
  const radius = searchParams.get("radius") ?? "25";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/events?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div>
        <label className="label text-xs">Sport</label>
        <select
          value={sport}
          onChange={(e) => update("sport", e.target.value)}
          className="input py-2 text-sm"
        >
          <option value="">Tous</option>
          {SPORT_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label text-xs">Niveau</label>
        <select
          value={level}
          onChange={(e) => update("level", e.target.value)}
          className="input py-2 text-sm"
        >
          <option value="">Tous</option>
          {LEVEL_OPTIONS_EVENT.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label text-xs">Rayon (km)</label>
        <select
          value={radius}
          onChange={(e) => update("radius", e.target.value)}
          className="input py-2 text-sm"
        >
          {[10, 25, 50, 100].map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
      </div>
    </div>
  );
}
