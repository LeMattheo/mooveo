"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function exchangeCodeForSession(code: string, next = "/events") {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  redirect(next);
}
