import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RequestsContent } from "./RequestsContent";

export default async function PartnerRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: receivedRows } = await supabase
    .from("partnerships")
    .select("id, requester_id, status, created_at")
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: sentRows } = await supabase
    .from("partnerships")
    .select("id, addressee_id, status, created_at")
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const requesterIds = (receivedRows ?? []).map((r) => r.requester_id);
  const addresseeIds = (sentRows ?? []).map((s) => s.addressee_id);
  const allIds = Array.from(new Set([...requesterIds, ...addresseeIds]));
  let profiles: { id: string; username: string; full_name: string | null; avatar_url: string | null }[] = [];
  if (allIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", allIds);
    profiles = data ?? [];
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const received = (receivedRows ?? []).map((r) => ({
    partnershipId: r.id,
    type: "received" as const,
    profile: profileMap.get(r.requester_id) ?? {
      id: r.requester_id,
      username: "?",
      full_name: null,
      avatar_url: null,
    },
  }));

  const sent = (sentRows ?? []).map((s) => ({
    partnershipId: s.id,
    type: "sent" as const,
    profile: profileMap.get(s.addressee_id) ?? {
      id: s.addressee_id,
      username: "?",
      full_name: null,
      avatar_url: null,
    },
  }));

  return (
    <main>
      <Link
        href="/partners"
        className="text-emerald-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Retour aux partenaires
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Demandes de partenariat
      </h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Demandes reçues
        </h2>
        {received.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune demande reçue.</p>
        ) : (
          <RequestsContent items={received} />
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Demandes envoyées
        </h2>
        {sent.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune demande envoyée.</p>
        ) : (
          <RequestsContent items={sent} />
        )}
      </section>
    </main>
  );
}
