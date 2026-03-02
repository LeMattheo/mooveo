"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;
    setLoading(true);
    const supabase = createClient();
    // URL sans paramètres : à ajouter telle quelle dans Supabase > Redirect URLs
    const redirectTo = `${APP_URL}/auth/reset-password-callback`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="card w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Email envoyé</h1>
          <p className="text-slate-600 text-sm mb-6">
            Si un compte existe pour <strong>{email}</strong>, tu as reçu un lien pour réinitialiser ton mot de passe.
            Vérifie ta boîte de réception (et les spams).
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Retour à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Mot de passe oublié</h1>
        <p className="text-slate-600 text-sm mb-6">
          Saisis ton email et on t’envoie un lien pour réinitialiser ton mot de passe.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="vous@exemple.fr"
              required
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>
        <Link href="/login" className="block mt-4 text-center text-sm text-slate-600 hover:text-emerald-600">
          ← Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
