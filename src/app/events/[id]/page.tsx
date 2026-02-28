import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SPORT_EMOJI } from "@/types";
import type { Sport } from "@/types";
import { EventMap } from "@/components/events/EventMap";
import { JoinButton } from "@/components/events/JoinButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (eventError || !event) notFound();

  const { data: participants } = await supabase
    .from("event_participants")
    .select("user_id, profiles(username, full_name)")
    .eq("event_id", id);

  const { data: organizer } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", event.organizer_id)
    .single();

  const isOrganizer = event.organizer_id === user.id;
  const isJoined = participants?.some((p) => p.user_id === user.id) ?? false;
  const participantsCount = participants?.length ?? 0;
  const isFull = participantsCount >= event.max_participants;
  const isCancelled = event.status === "cancelled";

  const sport = event.sport as Sport;
  const emoji = sport in SPORT_EMOJI ? SPORT_EMOJI[sport] : "📍";

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <Link href="/events" className="text-emerald-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux sorties
      </Link>

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-3xl">{emoji}</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{event.title}</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(event.event_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {event.sport}
              {event.level && event.level !== "tous niveaux" && ` • ${event.level}`}
            </p>
          </div>
          <JoinButton
            eventId={id}
            isOrganizer={isOrganizer}
            isJoined={isJoined}
            isFull={isFull}
            isCancelled={isCancelled}
          />
        </div>

        {event.description && (
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">{event.description}</p>
        )}

        <dl className="mt-4 grid gap-2 text-sm">
          <div>
            <dt className="text-gray-500">Lieu de rendez-vous</dt>
            <dd className="font-medium">{event.meeting_name}</dd>
          </div>
          {event.duration_min != null && (
            <div>
              <dt className="text-gray-500">Durée</dt>
              <dd>{event.duration_min} min</dd>
            </div>
          )}
          {event.distance_km != null && (
            <div>
              <dt className="text-gray-500">Distance</dt>
              <dd>{event.distance_km} km</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Participants</dt>
            <dd>
              {participantsCount} / {event.max_participants}
            </dd>
          </div>
          {organizer && (
            <div>
              <dt className="text-gray-500">Organisateur</dt>
              <dd>
                <Link
                  href={`/profile/${organizer.username}`}
                  className="text-blue-600 hover:underline"
                >
                  {organizer.full_name || organizer.username}
                </Link>
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-900 mb-2">Carte</h2>
          <EventMap
            lat={event.meeting_lat}
            lon={event.meeting_lon}
            title={event.meeting_name}
          />
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-900 mb-2">Participants</h2>
          <ul className="space-y-1">
            {participants?.map((p) => {
              const raw = p.profiles as unknown;
              const profile = Array.isArray(raw) ? raw[0] : raw;
              const pr = profile as { username: string; full_name: string | null } | null | undefined;
              const name = pr?.full_name || pr?.username || "Anonyme";
              const username = pr?.username;
              return (
                <li key={p.user_id}>
                  {username ? (
                    <Link href={`/profile/${username}`} className="text-blue-600 hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <span>{name}</span>
                  )}
                </li>
              );
            })}
            {(!participants || participants.length === 0) && (
              <li className="text-gray-500">Aucun participant pour l’instant.</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
