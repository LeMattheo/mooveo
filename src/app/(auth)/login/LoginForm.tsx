"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Au moins 6 caractères"),
  fullName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  async function onSubmit(values: FormValues) {
    setMessage(null);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: values.fullName ? { full_name: values.fullName } : undefined,
          },
        });
        if (error) {
          setMessage({ type: "error", text: error.message });
          return;
        }
        setMessage({ type: "success", text: "Inscription réussie. Redirection..." });
        router.push("/onboarding");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) {
          setMessage({
            type: "error",
            text: error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message,
          });
          return;
        }
        setMessage({ type: "success", text: "Connexion réussie. Redirection..." });
        router.push("/events");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isSignUp && (
        <div>
          <label htmlFor="fullName" className="label">Nom affiché</label>
          <input
            id="fullName"
            type="text"
            {...register("fullName")}
            className="input"
            placeholder="Jean Dupont"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="input"
          placeholder="vous@exemple.fr"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="input"
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {message.text}
        </p>
      )}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Chargement..." : isSignUp ? "S'inscrire" : "Se connecter"}
      </button>
      <button
        type="button"
        onClick={() => { setIsSignUp((v) => !v); setMessage(null); }}
        className="w-full text-sm text-slate-600 hover:text-emerald-600 mt-2"
      >
        {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
      </button>
    </form>
  );
}
