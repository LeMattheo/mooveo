"use client";

import type { Sport } from "@/types";
import { SPORT_EMOJI } from "@/types";

interface StepSportProps {
  selected: Sport[];
  onToggle: (sport: Sport) => void;
}

export function StepSport({ selected, onToggle }: StepSportProps) {
  const sports: Sport[] = ["vélo", "course", "marche"];

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Choisis au moins un sport que tu pratiques.</p>
      <div className="flex flex-wrap gap-3">
        {sports.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => onToggle(sport)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-colors ${
              selected.includes(sport)
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <span className="text-2xl">{SPORT_EMOJI[sport]}</span>
            <span className="font-medium capitalize">{sport}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
