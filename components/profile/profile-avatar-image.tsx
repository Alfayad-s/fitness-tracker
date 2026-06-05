"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { avatarUrlWithRetry } from "@/lib/profile/avatar-image";
import { cn } from "@/lib/utils";

const MAX_RETRIES = 2;

type ProfileAvatarImageProps = {
  src: string | null | undefined;
  alt: string;
  size: number;
  className?: string;
  priority?: boolean;
  fallback: React.ReactNode;
};

export function ProfileAvatarImage({
  src,
  alt,
  size,
  className,
  priority = false,
  fallback,
}: ProfileAvatarImageProps) {
  const [failed, setFailed] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    setRetryAttempt(0);
  }, [src]);

  const displaySrc = useMemo(() => {
    if (!src?.trim() || failed) return null;
    if (retryAttempt > 0) {
      return avatarUrlWithRetry(src, retryAttempt);
    }
    return src;
  }, [failed, retryAttempt, src]);

  if (!displaySrc) {
    return <>{fallback}</>;
  }

  return (
    <Image
      key={displaySrc}
      src={displaySrc}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized
      referrerPolicy="no-referrer"
      className={cn(className)}
      onError={() => {
        if (retryAttempt < MAX_RETRIES) {
          setRetryAttempt((attempt) => attempt + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
