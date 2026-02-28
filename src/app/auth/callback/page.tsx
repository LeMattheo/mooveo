"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { exchangeCodeForSession } from "./actions";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const supabase = createClient();
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const next = new URLSearchParams(search).get("next") ?? "/events";

    const run = async () => {
      const code = new URLSearchParams(search).get("code");
      if (code) {
        try {
          await exchangeCodeForSession(code, next);
        } catch {
          setStatus("error");
        }
        return;
      }

      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            setStatus("error");
            return;
          }
          router.replace(next);
          return;
        }
      }

      router.replace("/events");
    };

    run();
  }, [router]);

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">
          Erreur de connexion.{" "}
          <a href="/login" className="underline">
            Retour à la connexion
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-gray-600">Connexion en cours...</p>
    </main>
  );
}
