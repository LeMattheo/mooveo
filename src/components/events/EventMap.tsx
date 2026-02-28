"use client";

interface EventMapProps {
  lat: number;
  lon: number;
  title?: string;
  className?: string;
}

export function EventMap({ lat, lon, title, className = "" }: EventMapProps) {
  const delta = 0.01;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=map&marker=${lat},${lon}`;
  const linkUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;

  return (
    <div className={className}>
      <iframe
        title={title ?? "Carte"}
        src={embedUrl}
        className="w-full h-64 rounded-xl border border-gray-200"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
      >
        Ouvrir dans OpenStreetMap
      </a>
    </div>
  );
}
