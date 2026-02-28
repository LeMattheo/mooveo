import { z } from "zod";

export const sportSchema = z.enum(["vélo", "course", "marche"]);
export const levelSchema = z.enum(["débutant", "intermédiaire", "confirmé", "expert"]);
export const levelEventSchema = z.enum(["débutant", "intermédiaire", "confirmé", "expert", "tous niveaux"]);

export const onboardingProfileSchema = z.object({
  full_name: z.string().min(1, "Le nom est requis").max(100),
  sports: z.array(sportSchema).min(1, "Choisis au moins un sport"),
  home_lat: z.number(),
  home_lon: z.number(),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().max(2000).optional(),
  sport: sportSchema,
  level: levelEventSchema.optional(),
  event_date: z.string().min(1, "Date requise"),
  duration_min: z.coerce.number().int().min(0).max(600).optional(),
  distance_km: z.coerce.number().min(0).max(500).optional(),
  meeting_name: z.string().min(1, "Lieu de rendez-vous requis").max(300),
  meeting_lat: z.number(),
  meeting_lon: z.number(),
  max_participants: z.coerce.number().int().min(1).max(100).default(20),
});

export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;
export type EventInput = z.infer<typeof eventSchema>;
