"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface PartnerButtonProps {
  addresseeId: string;
  username: string;
}

type Status = "none" | "pending_sent" | "pending_received" | "accepted";

export function PartnerButton({ addresseeId, username }: PartnerButtonProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const [partnershipId, setPartnershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: sent } = await supabase
        .from("partnerships")
        .select("id, status")
        .eq("requester_id", user.id)
        .eq("addressee_id", addresseeId)
        .maybeSingle();
      if (sent) {
        setPartnershipId(sent.id);
        setStatus(
          sent.status === "accepted"
            ? "accepted"
            : sent.status === "pending"
              ? "pending_sent"
              : "none"
        );
        return;
      }
      const { data: recv } = await supabase
        .from("partnerships")
        .select("id, status")
        .eq("addressee_id", user.id)
        .eq("requester_id", addresseeId)
        .maybeSingle();
      if (recv) {
        setPartnershipId(recv.id);
        setStatus(
          recv.status === "accepted"
            ? "accepted"
            : recv.status === "pending"
              ? "pending_received"
              : "none"
        );
        return;
      }
      setStatus("none");
    })();
  }, [addresseeId]);

  const handleAdd = async () => {
    if (status !== "none" || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partners/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressee_id: addresseeId }),
      });
      if (res.ok) setStatus("pending_sent");
    } finally {
      setLoading(false);
    }
  };

  if (status === null) return null;

  if (status === "accepted") {
    return (
      <span className="rounded-lg border border-emerald-500 px-3 py-2 text-sm text-emerald-700">
        Partenaire ✓
      </span>
    );
  }

  if (status === "pending_sent") {
    return (
      <span className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500">
        Demande envoyée
      </span>
    );
  }

  if (status === "pending_received") {
    return (
      <Link
        href="/partners/requests"
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Répondre à la demande
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={loading}
      className="btn-primary text-sm py-2"
    >
      Ajouter comme partenaire
    </button>
  );
}
