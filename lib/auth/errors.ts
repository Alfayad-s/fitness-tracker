export const AUTH_ERROR_CODES = {
  callbackFailed: "auth_callback_failed",
  oauthDenied: "oauth_denied",
  oauthFailed: "oauth_failed",
  missingEmail: "missing_email",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.callbackFailed]:
    "Sign-in link expired or is invalid. Please try again.",
  [AUTH_ERROR_CODES.oauthDenied]: "Sign-in was cancelled.",
  [AUTH_ERROR_CODES.oauthFailed]:
    "Sign-in with the provider failed. Check Supabase Google/Apple settings.",
  [AUTH_ERROR_CODES.missingEmail]:
    "No email was returned from the provider. Allow email scope and try again.",
};

export function getAuthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[code as AuthErrorCode];
  }
  return "Something went wrong during sign-in. Please try again.";
}
