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

  let body: { partnership_id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const { partnership_id: partnershipId, action } = body;
  if (!partnershipId || !action) {
    return NextResponse.json(
      { error: "partnership_id et action requis" },
      { status: 400 }
    );
  }

  if (!["accept", "decline", "block"].includes(action)) {
    return NextResponse.json(
      { error: "action doit être accept, decline ou block" },
      { status: 400 }
    );
  }

  const { data: row, error: fetchError } = await supabase
    .from("partnerships")
    .select("id, addressee_id, requester_id, status")
    .eq("id", partnershipId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Demande introuvable" },
      { status: 404 }
    );
  }

  if (row.addressee_id !== user.id) {
    return NextResponse.json(
      { error: "Seul le destinataire peut répondre à cette demande" },
      { status: 403 }
    );
  }

  const newStatus =
    action === "accept"
      ? "accepted"
      : action === "decline"
        ? "declined"
        : "blocked";

  const { error: updateError } = await supabase
    .from("partnerships")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", partnershipId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  if (action === "accept") {
    await supabase.from("notification_jobs").insert({
      user_id: row.requester_id,
      related_user_id: user.id,
      type: "partnership_accepted",
      scheduled_at: new Date().toISOString(),
      status: "pending",
    });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
