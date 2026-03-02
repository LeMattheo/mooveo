"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Sport } from "@/types";

export async function updateProfileAction(data: {
  full_name: string | null;
  bio: string | null;
  level: string | null;
  home_lat: number | null;
  home_lon: number | null;
  home_display_name: string | null;
  sports: Sport[];
  avatar_url: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name?.trim() || null,
      bio: data.bio?.trim() || null,
      level: data.level || null,
      home_lat: data.home_lat,
      home_lon: data.home_lon,
      home_display_name: data.home_display_name || null,
      avatar_url: data.avatar_url || null,
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
  revalidatePath("/events");
  revalidatePath("/partners");
  return { error: null };
}
