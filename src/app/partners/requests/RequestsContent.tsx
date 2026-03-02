"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RequestItem {
  partnershipId: string;
  type: "received" | "sent";
  profile: Profile;
}

interface RequestsContentProps {
  items: RequestItem[];
}

export function RequestsContent({ items }: RequestsContentProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRespond = async (
    partnershipId: string,
    action: "accept" | "decline"
  ) => {
    setLoadingId(partnershipId);
    try {
      const res = await fetch("/api/partners/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnership_id: partnershipId, action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (partnershipId: string) => {
    setLoadingId(partnershipId);
    try {
      const res = await fetch("/api/partners/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnership_id: partnershipId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.partnershipId}
          className="card flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {item.profile.avatar_url ? (
              <img
                src={item.profile.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                {(item.profile.full_name || item.profile.username)
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <Link
                href={`/profile/${encodeURIComponent(item.profile.username)}`}
                className="font-semibold text-slate-800 hover:text-emerald-600"
              >
                {item.profile.full_name || item.profile.username}
              </Link>
              <p className="text-sm text-slate-500">@{item.profile.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {item.type === "received" && (
              <>
                <button
                  type="button"
                  onClick={() => handleRespond(item.partnershipId, "accept")}
                  disabled={loadingId === item.partnershipId}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(item.partnershipId, "decline")}
                  disabled={loadingId === item.partnershipId}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Décliner
                </button>
              </>
            )}
            {item.type === "sent" && (
              <button
                type="button"
                onClick={() => handleCancel(item.partnershipId)}
                disabled={loadingId === item.partnershipId}
                className="btn-secondary text-sm py-2"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
