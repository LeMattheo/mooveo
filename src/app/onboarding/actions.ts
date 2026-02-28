"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Sport } from "@/types";

export async function saveOnboardingAction(data: {
  full_name: string;
  sports: Sport[];
  home_lat: number;
  home_lon: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      home_lat: data.home_lat,
      home_lon: data.home_lon,
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  await supabase.from("profile_sports").delete().eq("profile_id", user.id);
  if (data.sports.length > 0) {
    const { error: sportsError } = await supabase.from("profile_sports").insert(
      data.sports.map((sport) => ({ profile_id: user.id, sport }))
    );
    if (sportsError) return { error: sportsError.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  redirect("/events");
}
