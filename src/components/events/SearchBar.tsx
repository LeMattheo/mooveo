"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [value, setValue] = useState(q);

  useEffect(() => {
    setValue(q);
  }, [q]);

  const updateUrl = useCallback(
    (newQ: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (newQ.trim()) next.set("q", newQ.trim());
      else next.delete("q");
      router.push(`/events?${next.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (value !== q) updateUrl(value);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const clear = () => {
    setValue("");
    updateUrl("");
  };

  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Rechercher une sortie, un lieu, un organisateur..."
        className="input pl-10 pr-10 py-2.5 text-sm"
        aria-label="Recherche"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Effacer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
