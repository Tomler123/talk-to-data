// src/utils/auth.ts

/**
 * Decode a JWT payload safely (handles URL-safe Base64 and padding).
 */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // URL-safe Base64 to standard Base64
    let b64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Pad with '=' to make length a multiple of 4
    while (b64.length % 4) {
      b64 += '=';
    }

    const json = atob(b64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Returns the parsed payload of the stored JWT, or null */
export function getTokenPayload(): Record<string, any> | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  return decodeJwtPayload(token);
}

/** True if a token exists in storage */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

/** Read the user’s role from the token payload */
export function getUserRole(): string | null {
  const payload = getTokenPayload();
  return payload?.role || null;
}

/** Parse the voice_verified_at claim (ISO string) into a Date */
export function getVoiceVerifiedAt(): Date | null {
  const payload = getTokenPayload();
  if (!payload?.voice_verified_at) return null;
  const d = new Date(payload.voice_verified_at);
  return isNaN(d.getTime()) ? null : d;
}

/** Returns true if voice was verified within the last `timeoutMinutes` */
export function isVoiceVerified(timeoutMinutes = 15): boolean {
  const t = getVoiceVerifiedAt();
  if (!t) return false;
  const diffMs = Date.now() - t.getTime();
  return diffMs < timeoutMinutes * 60 * 1000;
}
