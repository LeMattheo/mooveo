"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ProfileTabs({ basePath = "/profile" }: { basePath?: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";

  const isOwnProfile = basePath === "/profile";
  const tabs = [
    { id: "profile", label: "Profil", href: basePath },
    { id: "history", label: "Historique", href: `${basePath}?tab=history` },
    { id: "stats", label: "Stats", href: `${basePath}?tab=stats` },
    ...(isOwnProfile ? [{ id: "settings", label: "Paramètres", href: `${basePath}?tab=settings` }] : []),
  ];

  return (
    <nav className="flex gap-2 border-b border-slate-200 mb-6">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            tab === t.id
              ? "bg-white border border-b-0 border-slate-200 text-emerald-600 -mb-px"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
