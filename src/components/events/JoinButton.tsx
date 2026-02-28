"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface JoinButtonProps {
  eventId: string;
  isOrganizer: boolean;
  isJoined: boolean;
  isFull: boolean;
  isCancelled: boolean;
}

export function JoinButton({
  eventId,
  isOrganizer,
  isJoined,
  isFull,
  isCancelled,
}: JoinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    try {
      const { error: e } = await supabase
        .from("event_participants")
        .delete()
        .match({ event_id: eventId });
      if (e) setError(e.message);
      else router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!confirm("Annuler cette sortie ? Tous les participants seront prévenus.")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (isCancelled) {
    return <p className="text-red-600 font-medium">Sortie annulée</p>;
  }

  if (isOrganizer) {
    return (
      <div>
        <button
          type="button"
          onClick={handleCancelEvent}
          disabled={loading}
          className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "..." : "Annuler la sortie"}
        </button>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  if (isJoined) {
    return (
      <div>
        <button
          type="button"
          onClick={handleLeave}
          disabled={loading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {loading ? "..." : "Se désinscrire"}
        </button>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  if (isFull) {
    return <p className="text-amber-600 font-medium">Sortie complète</p>;
  }

  return (
    <div>
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Inscription..." : "Rejoindre"}
        </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
