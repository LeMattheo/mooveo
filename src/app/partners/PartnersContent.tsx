"use client";

import { useRouter } from "next/navigation";
import { PartnerCard } from "@/components/partners/PartnerCard";
import type { PartnerCardData } from "@/components/partners/PartnerCard";

interface PartnersContentProps {
  partners: Array<PartnerCardData & { partnership_id?: string | null }>;
  currentUserId: string;
  mode: "accepted" | "search";
}

export function PartnersContent({
  partners,
  currentUserId,
  mode,
}: PartnersContentProps) {
  const router = useRouter();

  if (partners.length === 0) {
    return (
      <p className="text-slate-600 text-sm">
        {mode === "accepted"
          ? "Vous n'avez pas encore de partenaire."
          : "Aucun profil trouvé avec ces critères."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {partners.map((p) => (
        <PartnerCard
          key={p.id}
          partner={p}
          partnershipId={p.partnership_id ?? undefined}
          onAction={() => router.refresh()}
        />
      ))}
    </div>
  );
}
