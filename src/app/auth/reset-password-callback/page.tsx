"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { exchangeCodeForSession } from "@/app/auth/callback/actions";

/**
 * Page de callback dédiée à la réinitialisation du mot de passe.
 * Supabase redirige ici après le clic sur le lien email (sans paramètres dans l’URL).
 * On échange le code puis on redirige vers /auth/set-password.
 */
export default function ResetPasswordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

    const code = params.get("code");
    const access_token = hashParams.get("access_token");
    const refresh_token = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    const run = async () => {
      // Flux PKCE : ?code=xxx
      if (code) {
        try {
          await exchangeCodeForSession(code, "/auth/set-password");
        } catch {
          setStatus("error");
        }
        return;
      }

      // Flux hash (ancien) : #access_token=...&type=recovery
      if (access_token && refresh_token && type === "recovery") {
        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          setStatus("error");
          return;
        }
        router.replace("/auth/set-password");
        return;
      }

      setStatus("error");
    };

    run();
  }, [router]);

  if (status === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-red-600 text-center">
          Lien invalide ou expiré. Demande un nouveau lien.
        </p>
        <Link href="/auth/forgot" className="btn-primary inline-block">
          Renvoyer un lien
        </Link>
        <Link href="/login" className="text-slate-600 hover:text-emerald-600 text-sm">
          ← Retour à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-slate-600">Redirection...</p>
    </main>
  );
}
