"use client";

import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { AvatarPresetPicker } from "@/components/profile/avatar-preset-picker";
import { Button } from "@/components/ui/button";
import type { AvatarPresetCategory } from "@/lib/avatars/presets";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_AVATAR_TYPES,
  AVATARS_BUCKET,
  MAX_AVATAR_SIZE_BYTES,
} from "@/lib/supabase/storage";
import { syncProfileAvatar } from "@/services/profile-actions";

type ProfileAvatarEditorProps = {
  userId: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  presetCategories: AvatarPresetCategory[];
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function ProfileAvatarEditor({
  userId,
  avatarUrl,
  displayName,
  email,
  presetCategories,
}: ProfileAvatarEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = getInitials(displayName, email);
  const busy = uploading;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError(null);

    if (
      !ALLOWED_AVATAR_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_TYPES)[number],
      )
    ) {
      setError("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setError("Image must be 2 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = getExtension(file.type);
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(
          uploadError.message.includes("Bucket not found")
            ? "Storage is not set up. Create the avatars bucket in Supabase (see docs/supabase-storage-setup.md)."
            : uploadError.message,
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      const result = await syncProfileAvatar(cacheBustedUrl);

      if (result.error) {
        throw new Error(result.error);
      }

      setPreview(cacheBustedUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update profile photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handlePresetSelect(src: string) {
    setPreview(src);
    setError(null);
    router.refresh();
  }

  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <div className="relative">
        <div
          className={cn(
            "relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-border",
            busy && "opacity-70",
          )}
        >
          {preview ? (
            <Image
              src={preview}
              alt={displayName ?? "Profile photo"}
              width={112}
              height={112}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-muted text-3xl font-semibold text-muted-foreground"
              aria-hidden
            >
              {initials}
            </span>
          )}
        </div>

        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-11 w-11 rounded-full border border-border shadow-md"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label="Upload profile photo"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(",")}
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>

      <div className="text-center">
        <p className="text-base font-medium">Profile photo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo or pick a preset below
        </p>
      </div>

      <AvatarPresetPicker
        categories={presetCategories}
        selectedSrc={preview}
        disabled={busy}
        onSelect={handlePresetSelect}
        onError={(message) => setError(message || null)}
      />

      {error && (
        <p
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </section>
  );
}
