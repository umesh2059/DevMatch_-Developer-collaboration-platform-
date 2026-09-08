// Note: no `import "server-only"` guard here (unlike most of lib/) because
// this module is also imported directly by server.ts - see the comment in
// lib/session.ts for why.
import { prisma } from "@/lib/prisma";

/** Throws unless the given user is a member of the given team. */
export async function requireTeamMembership(teamId: string, userId: string) {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!membership) {
    throw new Error("You are not a member of this team.");
  }
  return membership;
}
