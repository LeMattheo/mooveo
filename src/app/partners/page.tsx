import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PartnerFilters } from "@/components/partners/PartnerFilters";
import { PartnersContent } from "./PartnersContent";

interface PageProps {
  searchParams: Promise<{
    sport?: string;
    level?: string;
    radius?: string;
    q?: string;
  }>;
}

export default async function PartnersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const sportFilter = params.sport ?? null;
  const levelFilter = params.level ?? null;
  const radiusKm = Math.min(
    100,
    Math.max(25, parseInt(params.radius ?? "50", 10) || 50)
  );
  const searchQuery = params.q?.trim() || null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_lat, home_lon")
    .eq("id", user.id)
    .single();

  const userLat = profile?.home_lat ?? 46.6;
  const userLon = profile?.home_lon ?? 1.88;

  const { data: partnersList } = await supabase.rpc("search_partners", {
    user_lat: userLat,
    user_lon: userLon,
    radius_km: radiusKm,
    sport_filter: sportFilter,
    level_filter: levelFilter,
    search_query: searchQuery,
    current_user_id: user.id,
  });

  const partners = (partnersList ?? []) as Array<{
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
    partnership_id: string | null;
  }>;

  const acceptedPartners = partners.filter((p) =>
    p.partnership_status?.startsWith("accepted")
  );
  const searchablePartners = partners.filter(
    (p) => !p.partnership_status?.startsWith("accepted")
  );
  const suggestedPartners = searchablePartners.slice(0, 12);
  const { count: pendingReceivedCount } = await supabase
    .from("partnerships")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  const pendingCount = pendingReceivedCount ?? 0;

  return (
    <main>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Partenaires sportifs
      </h1>

      {pendingCount > 0 && (
        <Link
          href="/partners/requests"
          className="inline-flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-red-700 font-medium mb-6"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {pendingCount}
          </span>
          Demande{pendingCount > 1 ? "s" : ""} reçue
          {pendingCount > 1 ? "s" : ""}
        </Link>
      )}

      <PartnerFilters />

      {acceptedPartners.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Mes partenaires
          </h2>
          <PartnersContent
            partners={acceptedPartners}
            currentUserId={user.id}
            mode="accepted"
          />
        </section>
      )}

      {suggestedPartners.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Partenaires suggérés
          </h2>
          <p className="text-slate-600 text-sm mb-4">
            Quelques profils près de chez toi pour commencer.
          </p>
          <PartnersContent
            partners={suggestedPartners}
            currentUserId={user.id}
            mode="search"
          />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Trouver des partenaires
        </h2>
        <p className="text-slate-600 text-sm mb-4">
          {searchablePartners.length} profil{searchablePartners.length !== 1 ? "s" : ""} dans un
          rayon de {radiusKm} km
        </p>
        <PartnersContent
          partners={searchablePartners}
          currentUserId={user.id}
          mode="search"
        />
      </section>
    </main>
  );
}
