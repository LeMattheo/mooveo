import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { partnership_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const partnershipId = body.partnership_id;
  if (!partnershipId) {
    return NextResponse.json(
      { error: "partnership_id requis" },
      { status: 400 }
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from("partnerships")
    .select("id, requester_id, status")
    .eq("id", partnershipId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Demande introuvable" },
      { status: 404 }
    );
  }

  if (row.requester_id !== user.id) {
    return NextResponse.json(
      { error: "Seul l'expéditeur peut annuler la demande" },
      { status: 403 }
    );
  }

  if (row.status !== "pending") {
    return NextResponse.json(
      { error: "Cette demande n'est plus en attente" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("partnerships")
    .delete()
    .eq("id", partnershipId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
