/** Append a cache-busting query param for retry loads after transient CDN failures. */
export function avatarUrlWithRetry(src: string, attempt: number): string {
  if (attempt <= 0) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}retry=${attempt}`;
}
