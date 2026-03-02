"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { StepLocation } from "@/components/onboarding/StepLocation";
import { geocodeToCoords } from "@/lib/geocoding";
import { updateProfileAction } from "@/app/profile/actions";
import { createClient } from "@/lib/supabase/client";
import {
  SPORT_OPTIONS,
  LEVEL_OPTIONS,
  type Sport,
  type Level,
} from "@/types";

interface ProfileSettingsFormProps {
  initial: {
    full_name: string | null;
    bio: string | null;
    level: string | null;
    home_lat: number | null;
    home_lon: number | null;
    home_display_name: string | null;
    avatar_url: string | null;
    sports: Sport[];
  };
}

export function ProfileSettingsForm({ initial }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [level, setLevel] = useState<string>(initial.level ?? "");
  const [homeLat, setHomeLat] = useState<number | null>(initial.home_lat);
  const [homeLon, setHomeLon] = useState<number | null>(initial.home_lon);
  const [homeDisplayName, setHomeDisplayName] = useState<string | null>(initial.home_display_name ?? null);
  const [sports, setSports] = useState<Sport[]>(initial.sports);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSport = (sport: Sport) => {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Choisis une image (JPEG, PNG, WebP ou GIF).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image trop lourde (max 2 Mo).");
      return;
    }
    setAvatarError(null);
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAvatarError("Non connecté.");
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setAvatarError(uploadError.message === "Bucket not found"
        ? "Le stockage des photos n’est pas encore activé. Tu peux enregistrer le reste (position, nom, etc.) sans photo."
        : uploadError.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    const result = await updateProfileAction({
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      level: level || null,
      home_lat: homeLat,
      home_lon: homeLon,
      home_display_name: homeDisplayName,
      sports,
      avatar_url: avatarUrl,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setAvatarError(null);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Photo de profil</h3>
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-2xl font-semibold">
              ?
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-xs">
              Envoi…
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-sm py-2"
          >
            {avatarUrl ? "Changer la photo" : "Ajouter une photo"}
          </button>
        </div>
      </div>
      {avatarError && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 -mt-2">
          {avatarError}
        </p>
      )}

      <div>
        <label className="label">Nom affiché</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder="Ton prénom ou nom"
        />
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="input min-h-[80px]"
          placeholder="En quelques mots..."
          rows={3}
        />
      </div>
      <div>
        <label className="label">Niveau</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="input"
        >
          <option value="">—</option>
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Sports</label>
        <div className="flex flex-wrap gap-2">
          {SPORT_OPTIONS.map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sports.includes(s)}
                onChange={() => toggleSport(s)}
                className="rounded border-slate-300"
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Position (pour les sorties et partenaires à proximité)</label>
        <StepLocation
          lat={homeLat}
          lon={homeLon}
          displayName={homeDisplayName}
          onLocation={(lat, lon, displayName) => {
            setHomeLat(lat);
            setHomeLon(lon);
            setHomeDisplayName(displayName ?? null);
          }}
          onSearch={geocodeToCoords}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          Profil enregistré. Ta position et tes infos sont à jour.
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
