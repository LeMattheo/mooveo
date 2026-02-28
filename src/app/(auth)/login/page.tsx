import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center py-12">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Connexion</h1>
        <p className="text-slate-600 text-sm mb-6">Connecte-toi ou crée un compte pour accéder aux sorties.</p>
        <LoginForm />
      </div>
    </main>
  );
}
