import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, organizer_id, status")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });
  }
  if (event.organizer_id !== user.id) {
    return NextResponse.json({ error: "Tu n'es pas l'organisateur" }, { status: 403 });
  }
  if (event.status !== "active") {
    return NextResponse.json({ error: "Sortie déjà annulée ou terminée" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { data: participants } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", eventId);

  if (participants?.length) {
    await supabase.from("notification_jobs").insert(
      participants.map((p) => ({
        event_id: eventId,
        user_id: p.user_id,
        type: "cancellation",
        scheduled_at: new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
