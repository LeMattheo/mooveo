import Link from "next/link";
import { NewEventForm } from "@/components/events/NewEventForm";

export default function NewEventPage() {
  return (
    <main>
      <Link href="/events" className="text-emerald-600 hover:underline text-sm mb-4 inline-block">
        ← Retour aux sorties
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Créer une sortie</h1>
      <div className="card max-w-xl">
        <NewEventForm />
      </div>
    </main>
  );
}
