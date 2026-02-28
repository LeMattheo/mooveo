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
    .select("id, status, max_participants, organizer_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });
  }
  if (event.status !== "active") {
    return NextResponse.json({ error: "Cette sortie n'est plus disponible" }, { status: 400 });
  }

  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (count != null && count >= event.max_participants) {
    return NextResponse.json({ error: "Sortie complète" }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Tu es déjà inscrit" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase.from("notification_jobs").insert({
    event_id: eventId,
    user_id: user.id,
    type: "join_confirm",
    scheduled_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
