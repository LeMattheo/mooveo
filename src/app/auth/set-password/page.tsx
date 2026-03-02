"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/events");
    router.refresh();
  }

  if (hasSession === false) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Lien invalide ou expiré</h1>
          <p className="text-slate-600 text-sm mb-6">
            Ce lien de réinitialisation a expiré ou a déjà été utilisé. Demande un nouveau lien.
          </p>
          <Link href="/auth/forgot" className="btn-primary inline-block">
            Renvoyer un lien
          </Link>
          <Link href="/login" className="block mt-4 text-sm text-slate-600 hover:text-emerald-600">
            ← Retour à la connexion
          </Link>
        </div>
      </main>
    );
  }

  if (hasSession === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-600">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Nouveau mot de passe</h1>
        <p className="text-slate-600 text-sm mb-6">
          Choisis un nouveau mot de passe pour ton compte.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="label">Nouveau mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirmer le mot de passe</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
        <Link href="/login" className="block mt-4 text-center text-sm text-slate-600 hover:text-emerald-600">
          ← Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
