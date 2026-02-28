"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createEventAction } from "@/app/events/new/actions";
import { searchAddress, geocodeToCoords } from "@/lib/geocoding";
import { SPORT_EMOJI, LEVEL_OPTIONS_EVENT } from "@/types";
import type { Sport } from "@/types";

export function NewEventForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [meetingQuery, setMeetingQuery] = useState("");
  const [meetingSuggestions, setMeetingSuggestions] = useState<Array<{ lat: string; lon: string; display_name: string }>>([]);
  const [meetingLat, setMeetingLat] = useState<string>("");
  const [meetingLon, setMeetingLon] = useState<string>("");
  const [meetingName, setMeetingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleMeetingSearch = async () => {
    if (meetingQuery.trim().length < 3) return;
    const results = await searchAddress(meetingQuery);
    setMeetingSuggestions(results);
  };

  const selectPlace = (lat: string, lon: string, display_name: string) => {
    setMeetingLat(lat);
    setMeetingLon(lon);
    setMeetingName(display_name);
    setMeetingSuggestions([]);
    setMeetingQuery(display_name);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let finalMeetingName = meetingName;
    let finalLat = meetingLat;
    let finalLon = meetingLon;

    if (!finalLat || !finalLon) {
      if (meetingQuery.trim().length >= 3) {
        const coords = await geocodeToCoords(meetingQuery);
        if (coords) {
          finalMeetingName = coords.display_name;
          finalLat = String(coords.lat);
          finalLon = String(coords.lon);
        }
      }
      if (!finalLat || !finalLon) {
        setError("Indique un lieu de rendez-vous (recherche ville ou adresse).");
        setSubmitting(false);
        return;
      }
    }

    const form = formRef.current ?? e.currentTarget;
    if (!form || !(form instanceof HTMLFormElement)) {
      setError("Formulaire invalide.");
      setSubmitting(false);
      return;
    }

    const payload = {
      title: (form.querySelector('[name="title"]') as HTMLInputElement)?.value ?? "",
      description: (form.querySelector('[name="description"]') as HTMLTextAreaElement)?.value || undefined,
      sport: (form.querySelector('[name="sport"]') as HTMLSelectElement)?.value ?? "vélo",
      level: (form.querySelector('[name="level"]') as HTMLSelectElement)?.value || undefined,
      event_date: (form.querySelector('[name="event_date"]') as HTMLInputElement)?.value ?? "",
      duration_min: (form.querySelector('[name="duration_min"]') as HTMLInputElement)?.value || undefined,
      distance_km: (form.querySelector('[name="distance_km"]') as HTMLInputElement)?.value || undefined,
      meeting_name: finalMeetingName,
      meeting_lat: finalLat,
      meeting_lon: finalLon,
      max_participants: (form.querySelector('[name="max_participants"]') as HTMLInputElement)?.value ?? "20",
    };

    const result = await createEventAction(payload);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
  };

  const sports: Sport[] = ["vélo", "course", "marche"];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="label">Titre *</label>
        <input name="title" required placeholder="Sortie vélo matinale" className="input" />
      </div>

      <div>
        <label className="label">Sport *</label>
        <select name="sport" required className="input">
          {sports.map((s) => (
            <option key={s} value={s}>
              {SPORT_EMOJI[s]} {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Niveau</label>
        <select name="level" className="input">
          <option value="tous niveaux">Tous niveaux</option>
          {LEVEL_OPTIONS_EVENT.filter((l) => l !== "tous niveaux").map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Date et heure *</label>
        <input
          name="event_date"
          type="datetime-local"
          required
          min={new Date().toISOString().slice(0, 16)}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Durée (min)</label>
          <input name="duration_min" type="number" min={0} placeholder="90" className="input" />
        </div>
        <div>
          <label className="label">Distance (km)</label>
          <input name="distance_km" type="number" step="0.1" min={0} placeholder="25" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Lieu de rendez-vous *</label>
        <input
          type="text"
          value={meetingQuery}
          onChange={(e) => setMeetingQuery(e.target.value)}
          onBlur={() => setTimeout(() => setMeetingSuggestions([]), 200)}
          onFocus={() => meetingName && setMeetingSuggestions([])}
          placeholder="Ville, adresse ou lieu (ex: Parking Forêt de Fontainebleau)"
          className="input"
        />
        <button
          type="button"
          onClick={handleMeetingSearch}
          className="mt-1 text-sm text-blue-600 hover:underline"
        >
          Rechercher sur la carte
        </button>
        {meetingSuggestions.length > 0 && (
          <ul className="mt-1 border border-gray-200 rounded-lg overflow-hidden bg-white shadow">
            {meetingSuggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectPlace(s.lat, s.lon, s.display_name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {meetingName && (
          <p className="mt-1 text-sm text-green-600">Lieu : {meetingName}</p>
        )}
        <input type="hidden" name="meeting_name" value={meetingName} />
        <input type="hidden" name="meeting_lat" value={meetingLat} />
        <input type="hidden" name="meeting_lon" value={meetingLon} />
      </div>

      <div>
        <label className="label">Nombre max de participants</label>
        <input name="max_participants" type="number" min={1} max={100} defaultValue={20} className="input" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea name="description" rows={3} placeholder="Optionnel" className="input" />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => router.push("/events")} className="btn-secondary">
          Annuler
        </button>
        <button type="submit" disabled={submitting} className="flex-1 btn-primary">
          {submitting ? "Création..." : "Créer la sortie"}
        </button>
      </div>
    </form>
  );
}
