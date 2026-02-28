"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/validations";

type EventFormPayload = {
  title: string;
  description?: string;
  sport: string;
  level?: string;
  event_date: string;
  duration_min?: string;
  distance_km?: string;
  meeting_name: string;
  meeting_lat: string;
  meeting_lon: string;
  max_participants?: string | number;
};

export async function createEventAction(payload: EventFormPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = {
    title: payload.title,
    description: payload.description || undefined,
    sport: payload.sport,
    level: payload.level || undefined,
    event_date: payload.event_date,
    duration_min: payload.duration_min || undefined,
    distance_km: payload.distance_km || undefined,
    meeting_name: payload.meeting_name,
    meeting_lat: payload.meeting_lat,
    meeting_lon: payload.meeting_lon,
    max_participants: payload.max_participants ?? 20,
  };

  const parse = eventSchema.safeParse({
    ...raw,
    meeting_lat: raw.meeting_lat != null ? parseFloat(String(raw.meeting_lat)) : undefined,
    meeting_lon: raw.meeting_lon != null ? parseFloat(String(raw.meeting_lon)) : undefined,
  });

  if (!parse.success) {
    const first = parse.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().join(". ") || "Données invalides.";
    return { error: msg };
  }

  const d = parse.data;
  const eventDate = new Date(d.event_date).toISOString();

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: d.title,
      description: d.description ?? null,
      sport: d.sport,
      level: d.level ?? null,
      event_date: eventDate,
      duration_min: d.duration_min ?? null,
      distance_km: d.distance_km ?? null,
      meeting_name: d.meeting_name,
      meeting_lat: d.meeting_lat,
      meeting_lon: d.meeting_lon,
      max_participants: d.max_participants,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}
