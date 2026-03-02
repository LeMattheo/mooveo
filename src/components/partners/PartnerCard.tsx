"use client";

import { useState } from "react";
import Link from "next/link";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";

export type PartnershipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted_sent"
  | "accepted_received"
  | "declined_sent"
  | "declined_received"
  | "blocked_sent"
  | "blocked_received";

export interface PartnerCardData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  level: string | null;
  bio: string | null;
  sports: string[] | null;
  distance_km: number | null;
  total_events: number;
  partnership_status: string;
}

interface PartnerCardProps {
  partner: PartnerCardData;
  partnershipId?: string | null;
  onAction?: () => void;
}

export function PartnerCard({
  partner,
  partnershipId,
  onAction,
}: PartnerCardProps) {
  const [loading, setLoading] = useState(false);
  const status = partner.partnership_status as PartnershipStatus;

  const handleRequest = async () => {
    if (status !== "none" || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partners/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressee_id: partner.id }),
      });
      if (res.ok) onAction?.();
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (action: "accept" | "decline") => {
    if (!partnershipId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partners/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnership_id: partnershipId, action }),
      });
      if (res.ok) onAction?.();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!partnershipId || status !== "pending_sent" || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partners/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnership_id: partnershipId }),
      });
      if (res.ok) onAction?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        {partner.avatar_url ? (
          <img
            src={partner.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            {(partner.full_name || partner.username).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${encodeURIComponent(partner.username)}`}
            className="font-semibold text-slate-800 hover:text-emerald-600"
          >
            {partner.full_name || partner.username}
          </Link>
          <p className="text-sm text-slate-500">@{partner.username}</p>
        </div>
      </div>

      {partner.sports && partner.sports.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {partner.sports.map((s) => (
            <span
              key={s}
              className="text-xs bg-slate-100 rounded-full px-2 py-0.5"
            >
              {s in SPORT_EMOJI ? SPORT_EMOJI[s as Sport] : ""} {s}
            </span>
          ))}
        </div>
      )}
      {partner.level && (
        <p className="text-xs text-slate-500">Niveau : {partner.level}</p>
      )}
      {partner.distance_km != null && (
        <p className="text-sm text-slate-600">À {partner.distance_km} km</p>
      )}
      <p className="text-xs text-slate-400">
        {Number(partner.total_events) ?? 0} sorties
      </p>

      <div className="flex flex-wrap gap-2 pt-2">
        {status === "none" && (
          <button
            type="button"
            onClick={handleRequest}
            disabled={loading}
            className="btn-primary text-sm py-2"
          >
            Ajouter comme partenaire
          </button>
        )}
        {status === "pending_sent" && (
          <>
            <span className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500">
              Demande envoyée
            </span>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn-secondary text-sm py-2"
            >
              Annuler
            </button>
          </>
        )}
        {status === "pending_received" && (
          <>
            <button
              type="button"
              onClick={() => handleRespond("accept")}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Accepter
            </button>
            <button
              type="button"
              onClick={() => handleRespond("decline")}
              disabled={loading}
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Décliner
            </button>
          </>
        )}
        {(status === "accepted_sent" || status === "accepted_received") && (
          <>
            <span className="rounded-lg border border-emerald-500 px-3 py-2 text-sm text-emerald-700">
              Partenaire ✓
            </span>
            <Link
              href={`/profile/${encodeURIComponent(partner.username)}`}
              className="btn-secondary text-sm py-2"
            >
              Voir le profil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
