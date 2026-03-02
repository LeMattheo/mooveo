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

  let body: { addressee_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const addresseeId = body.addressee_id;
  if (!addresseeId || typeof addresseeId !== "string") {
    return NextResponse.json(
      { error: "addressee_id requis" },
      { status: 400 }
    );
  }

  if (addresseeId === user.id) {
    return NextResponse.json(
      { error: "Impossible de s'ajouter soi-même" },
      { status: 400 }
    );
  }

  const { data: addressee } = await supabase
    .from("profiles")
    .select("id, is_banned")
    .eq("id", addresseeId)
    .single();

  if (!addressee) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }
  if (addressee.is_banned) {
    return NextResponse.json(
      { error: "Ce profil n'est pas disponible" },
      { status: 403 }
    );
  }

  const { data: existing1 } = await supabase
    .from("partnerships")
    .select("id, status")
    .eq("requester_id", user.id)
    .eq("addressee_id", addresseeId)
    .maybeSingle();
  const { data: existing2 } = await supabase
    .from("partnerships")
    .select("id, status")
    .eq("requester_id", addresseeId)
    .eq("addressee_id", user.id)
    .maybeSingle();

  if (existing1 || existing2) {
    return NextResponse.json(
      { error: "Une demande existe déjà entre vous deux" },
      { status: 409 }
    );
  }

  const { data: partnership, error: insertError } = await supabase
    .from("partnerships")
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  await supabase.from("notification_jobs").insert({
    user_id: addresseeId,
    related_user_id: user.id,
    type: "partnership_request",
    scheduled_at: new Date().toISOString(),
    status: "pending",
  });

  return NextResponse.json({ partnership });
}
