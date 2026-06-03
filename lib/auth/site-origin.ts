/**
 * Origin used for auth redirects. On the client, always use the current host
 * (works with Cloudflare tunnel). On the server, prefer NEXT_PUBLIC_SITE_URL.
 */
export function getClientSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getServerSiteOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const { origin } = new URL(request.url);
  return process.env.NEXT_PUBLIC_SITE_URL ?? origin;
}
