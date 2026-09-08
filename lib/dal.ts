import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

/**
 * Verifies the session cookie for the current request. Memoized per-render
 * with React's cache() so multiple call sites in one request only decrypt
 * the cookie once. Redirects unauthenticated requests to /login.
 */
export const verifySession = cache(async () => {
  const session = await getSessionPayload();
  if (!session?.userId) {
    redirect("/login");
  }
  return { userId: session.userId };
});

/** Same as verifySession but returns null instead of redirecting. */
export const optionalSession = cache(async () => {
  const session = await getSessionPayload();
  return session?.userId ? { userId: session.userId } : null;
});

export const getCurrentUser = cache(async () => {
  const session = await optionalSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      createdAt: true,
      skills: {
        select: {
          level: true,
          skill: { select: { id: true, name: true } },
        },
      },
    },
  });

  return user;
});

/** Like getCurrentUser but redirects to /login when unauthenticated. */
export async function requireCurrentUser() {
  await verifySession();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
