"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepSport } from "@/components/onboarding/StepSport";
import { StepLocation } from "@/components/onboarding/StepLocation";
import { StepProfile } from "@/components/onboarding/StepProfile";
import { saveOnboardingAction } from "./actions";
import { geocodeToCoords } from "@/lib/geocoding";
import type { Sport } from "@/types";

const STEPS = ["sport", "location", "profile"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [sports, setSports] = useState<Sport[]>([]);
  const [homeLat, setHomeLat] = useState<number | null>(null);
  const [homeLon, setHomeLon] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const toggleSport = (sport: Sport) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleNext = () => {
    if (step === "sport" && sports.length === 0) return;
    if (step === "location" && (homeLat == null || homeLon == null)) return;
    if (step === "profile" && !fullName.trim()) return;

    if (isLast) {
      setError(null);
      setSubmitting(true);
      saveOnboardingAction({
        full_name: fullName.trim(),
        sports,
        home_lat: homeLat!,
        home_lon: homeLon!,
      }).catch((err: Error) => {
        setError(err.message);
        setSubmitting(false);
      });
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const canNext =
    (step === "sport" && sports.length > 0) ||
    (step === "location" && homeLat != null && homeLon != null) ||
    (step === "profile" && fullName.trim().length > 0);

  return (
    <main className="flex flex-col items-center justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Bienvenue sur Sportify Rural</h1>
        <p className="text-slate-500 text-sm mb-6">
          Étape {stepIndex + 1} / {STEPS.length}
        </p>

        {step === "sport" && <StepSport selected={sports} onToggle={toggleSport} />}
        {step === "location" && (
          <StepLocation
            lat={homeLat}
            lon={homeLon}
            onLocation={(lat, lon) => {
              setHomeLat(lat);
              setHomeLon(lon);
            }}
            onSearch={geocodeToCoords}
          />
        )}
        {step === "profile" && (
          <StepProfile fullName={fullName} onChange={setFullName} />
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Retour
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext || submitting}
            className="flex-1 btn-primary"
          >
            {submitting ? "Enregistrement..." : isLast ? "Terminer" : "Continuer"}
          </button>
        </div>
      </div>
    </main>
  );
}
