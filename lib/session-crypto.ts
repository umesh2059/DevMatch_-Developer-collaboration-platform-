// Pure JWT sign/verify logic, deliberately free of any `next/headers`
// import. Merely importing `next/headers` triggers Next's internal
// AsyncLocalStorage setup, which only exists once Next's own server runtime
// has booted - so this file is safe to import from contexts Next doesn't
// control, like server.ts (the custom Socket.IO server) and proxy.ts.
// lib/session.ts wraps this with the cookie-reading/writing helpers that do
// need next/headers, for use in Server Components and Server Actions.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "devmatch_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
};
export async function encryptSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}
