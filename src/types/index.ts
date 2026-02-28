export type Sport = "vélo" | "course" | "marche";
export type Level = "débutant" | "intermédiaire" | "confirmé" | "expert" | "tous niveaux";
export type EventStatus = "active" | "cancelled" | "completed";

export const SPORT_EMOJI: Record<Sport, string> = {
  vélo: "🚴",
  course: "🏃",
  marche: "🚶",
};

export const SPORT_OPTIONS: Sport[] = ["vélo", "course", "marche"];
export const LEVEL_OPTIONS: Level[] = ["débutant", "intermédiaire", "confirmé", "expert"];
export const LEVEL_OPTIONS_EVENT: (Level | "tous niveaux")[] = [...LEVEL_OPTIONS, "tous niveaux"];
