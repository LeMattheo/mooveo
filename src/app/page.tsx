import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center py-16 px-4">
      <div className="card max-w-md w-full text-center">
        <span className="text-5xl mb-4 block">🚴</span>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Sportify Rural
        </h1>
        <p className="text-slate-600 mb-8">
          Trouve des sorties vélo, course et marche près de chez toi. Crée un événement ou rejoins d&apos;autres sportifs en milieu rural.
        </p>
        <Link
          href="/login"
          className="btn-primary inline-block w-full text-center"
        >
          Connexion / Inscription
        </Link>
      </div>
    </main>
  );
}
