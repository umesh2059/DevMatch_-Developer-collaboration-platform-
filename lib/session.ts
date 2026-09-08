// Cookie-reading/writing session helpers for use in Server Components and
// Server Actions. Kept separate from lib/session-crypto.ts (which server.ts
// and proxy.ts import instead) because importing `next/headers` here only
// works once Next's own server runtime has booted.
import "server-only";

import { cookies } from "next/headers";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  type SessionPayload,
} from "@/lib/session-crypto";

export async function createSession(userId: string) {
  const session = await encryptSession({ userId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return decryptSession(token);
}

export { SESSION_COOKIE, decryptSession, encryptSession };
export type { SessionPayload };
