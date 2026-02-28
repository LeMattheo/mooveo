/**
 * Géocodage via Nominatim (OpenStreetMap) — gratuit, pas de clé API
 */

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
  const res = await fetch(url, {
    headers: { "Accept-Language": "fr" },
  });
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
