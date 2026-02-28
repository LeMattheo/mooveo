"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function signInAction(params: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message,
    };
  }
  revalidatePath("/", "layout");
  revalidatePath("/events");
  redirect("/events");
}

export async function signUpAction(params: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: params.fullName ? { full_name: params.fullName } : undefined,
      emailRedirectTo: `${APP_URL}/auth/callback?next=/onboarding`,
    },
  });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  revalidatePath("/onboarding");
  redirect("/onboarding");
}
