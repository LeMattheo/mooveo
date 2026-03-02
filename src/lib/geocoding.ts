/**
 * Géocodage via Nominatim (OpenStreetMap) — gratuit, pas de clé API
 */

const NOMINATIM_HEADERS = {
  "Accept-Language": "fr",
  "User-Agent": "SportifyRural/1.0 (contact@example.com)",
};

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
}

export async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 3) return [];
  const encoded = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=fr&limit=5`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string; type?: string }>;
  return data.map((d) => ({
    lat: d.lat,
    lon: d.lon,
    display_name: d.display_name,
    type: d.type,
  }));
}

export async function geocodeToCoords(address: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
  const results = await searchAddress(address);
  if (results.length === 0) return null;
  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lon: parseFloat(first.lon),
    display_name: first.display_name,
  };
}

/** Reverse géocodage : coordonnées → adresse lisible */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
