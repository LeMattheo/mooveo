import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pendingPartnersCount = 0;
  if (user) {
    const { count } = await supabase
      .from("partnerships")
      .select("id", { count: "exact", head: true })
      .eq("addressee_id", user.id)
      .eq("status", "pending");
    pendingPartnersCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={user ? "/events" : "/"}
          className="flex items-center gap-2 font-bold text-slate-800 no-underline"
        >
          <span className="text-xl">🚴</span>
          <span className="hidden sm:inline">Sportify Rural</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link
                href="/events"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Sorties
              </Link>
              <Link
                href="/events/new"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Créer
              </Link>
              <Link
                href="/partners"
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Partenaires
                {pendingPartnersCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingPartnersCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Profil
              </Link>
              <form action={signOutAction} className="inline">
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
