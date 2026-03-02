"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { Sport } from "@/types";
import { SPORT_EMOJI } from "@/types";

// Fix icônes Leaflet cassées avec webpack/Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SPORT_COLORS: Record<string, string> = {
  vélo: "#f59e0b",
  course: "#10b981",
  marche: "#6366f1",
};

const DEFAULT_CENTER: [number, number] = [46.6, 1.88];
const DEFAULT_ZOOM = 10;

export interface EventForMap {
  id: string;
  title: string;
  sport: string;
  level: string | null;
  event_date: string;
  meeting_name: string;
  meeting_lat: number;
  meeting_lon: number;
  distance_km: number | null;
  participants_count: number;
  max_participants: number;
  organizer_username: string | null;
}

interface EventsMapProps {
  events: EventForMap[];
  userLat: number;
  userLon: number;
  radiusKm: number;
}

function createSportIcon(sport: string) {
  const color = SPORT_COLORS[sport] ?? "#6b7280";
  const emoji = sport in SPORT_EMOJI ? SPORT_EMOJI[sport as Sport] : "📍";
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export function EventsMap({
  events,
  userLat,
  userLon,
  radiusKm,
}: EventsMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const goToMyPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée par le navigateur.");
      return;
    }
    setLocationError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const map = mapRef.current;
        const marker = userMarkerRef.current;
        if (map) {
          map.setView([lat, lon], Math.max(map.getZoom(), 14));
          if (marker) marker.setLatLng([lat, lon]);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocationError("Autorisation refusée. Active la localisation pour ce site.");
        else if (err.code === 2) setLocationError("Position indisponible.");
        else if (err.code === 3) setLocationError("Délai dépassé. Réessaie.");
        else setLocationError("Impossible d'obtenir ta position.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const center: [number, number] =
      userLat != null && userLon != null ? [userLat, userLon] : DEFAULT_CENTER;

    const map = L.map(containerRef.current).setView(center, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Marqueur position utilisateur (bleu)
    const userIcon = L.divIcon({
      html: `<div style="background:#2563eb;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const userMarker = L.marker(center, { icon: userIcon })
      .addTo(map)
      .bindPopup("Votre position");
    userMarkerRef.current = userMarker;

    // Marqueurs des sorties
    events.forEach((event) => {
      const lat = event.meeting_lat;
      const lon = event.meeting_lon;
      if (lat == null || lon == null) return;

      const marker = L.marker([lat, lon], {
        icon: createSportIcon(event.sport),
      }).addTo(map);

      const popupContent = document.createElement("div");
      const root = document.createElement("div");
      popupContent.appendChild(root);
      // On utilise un contenu HTML simple pour la popup (pas de React car Leaflet gère le DOM)
      root.innerHTML = `
        <div class="min-w-[200px] p-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">${event.sport in SPORT_EMOJI ? SPORT_EMOJI[event.sport as Sport] : "📍"}</span>
            <span class="font-semibold text-slate-800">${escapeHtml(event.title)}</span>
          </div>
          <p class="text-sm text-slate-600">${formatDateFr(event.event_date)}</p>
          <p class="text-sm text-slate-500">📍 ${escapeHtml(event.meeting_name)}</p>
          ${event.distance_km != null ? `<p class="text-sm text-slate-500">À ${event.distance_km} km</p>` : ""}
          <p class="text-xs text-slate-400">${event.participants_count}/${event.max_participants} participants</p>
          ${event.level && event.level !== "tous niveaux" ? `<p class="text-xs text-slate-400">Niveau : ${escapeHtml(event.level)}</p>` : ""}
          <a href="/events/${event.id}" class="btn-primary inline-block mt-2 text-center text-sm py-2 w-full">Voir la sortie</a>
        </div>
      `;
      marker.bindPopup(popupContent);
    });

    mapRef.current = map;
    return () => {
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [events, userLat, userLon, radiusKm]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200"
        aria-label="Carte des sorties"
      />
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={goToMyPosition}
          disabled={locating}
          className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-md hover:bg-slate-50 disabled:opacity-60"
          title="Centrer sur ma position"
        >
          {locating ? (
            "Localisation..."
          ) : (
            <>
              <span className="text-lg" aria-hidden>📍</span>
              Ma position
            </>
          )}
        </button>
        {locationError && (
          <p className="max-w-[220px] rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
