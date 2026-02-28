"use client";

import { useState } from "react";

interface StepLocationProps {
  lat: number | null;
  lon: number | null;
  onLocation: (lat: number, lon: number) => void;
  onSearch: (query: string) => Promise<{ lat: number; lon: number; display_name: string } | null>;
}

export function StepLocation({ lat, lon, onLocation, onSearch }: StepLocationProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeolocate = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par ton navigateur.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setError("Impossible d'obtenir ta position. Utilise la recherche de ville ci-dessous.");
        setLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const result = await onSearch(query.trim());
      if (result) {
        onLocation(result.lat, result.lon);
      } else {
        setError("Aucun résultat. Essaie une autre ville ou un code postal.");
      }
    } catch {
      setError("Erreur de recherche.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        On en a besoin pour te proposer des sorties près de chez toi.
      </p>

      <button
        type="button"
        onClick={handleGeolocate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? "Chargement..." : "📍 Utiliser ma position actuelle"}
      </button>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">ou</span>
        <div className="border-t border-gray-200 my-4" />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ville ou code postal (ex: Lyon, 69001)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="bg-gray-100 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl disabled:opacity-50"
        >
          Rechercher
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {lat != null && lon != null && (
        <p className="text-sm text-green-600">Position enregistrée (lat: {lat.toFixed(4)}, lon: {lon.toFixed(4)})</p>
      )}
    </div>
  );
}
