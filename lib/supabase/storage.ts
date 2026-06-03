export const AVATARS_BUCKET = "avatars";

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
