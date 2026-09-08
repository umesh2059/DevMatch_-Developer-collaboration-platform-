import "server-only";

import { prisma } from "@/lib/prisma";

export type SkillLevel = { skillId: string; name: string; level: number };

/**
 * Scores how well a set of candidate skills covers a project's required
 * skills, on a 0-100 scale.
 *
 * - 70% of the score rewards *coverage*: what fraction of the required
 *   skills the candidate has at all.
 * - 30% rewards *depth*: how proficient (1-5) the candidate is, on average,
 *   in the skills they do share with the project.
 *
 * A candidate with none of the required skills always scores 0, even if
 * they have many unrelated skills - relevance to *this* project is what
 * matters for matching, not raw skill count.
 */
export function scoreSkillMatch(
  candidateSkills: SkillLevel[],
  requiredSkillIds: string[],
): number {
  if (requiredSkillIds.length === 0) return 0;

  const byId = new Map(candidateSkills.map((s) => [s.skillId, s]));
  const overlap = requiredSkillIds
    .map((id) => byId.get(id))
    .filter((s): s is SkillLevel => Boolean(s));

  if (overlap.length === 0) return 0;

  const coverage = overlap.length / requiredSkillIds.length;
  const avgDepth = overlap.reduce((sum, s) => sum + s.level, 0) / overlap.length / 5;

  return Math.round(coverage * 70 + avgDepth * 30);
}

export type ProjectMatch = {
  project: {
    id: string;
    title: string;
    description: string;
    status: string;
    owner: { id: string; name: string };
    skills: { skill: { id: string; name: string } }[];
  };
  score: number;
  matchedSkills: string[];
};

/**
 * Finds open projects a user hasn't joined or requested yet, ranked by how
 * well the user's skills cover each project's required skills.
 */
export async function getProjectMatchesForUser(
  userId: string,
  limit = 20,
): Promise<ProjectMatch[]> {
  const [userSkills, projects] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId },
      select: { skillId: true, level: true, skill: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: {
        status: "OPEN",
        ownerId: { not: userId },
        requests: { none: { requesterId: userId } },
        team: { is: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        owner: { select: { id: true, name: true } },
        skills: { select: { skill: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const candidateSkills: SkillLevel[] = userSkills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    level: s.level,
  }));

  const matches = projects
    .map((project) => {
      const requiredIds = project.skills.map((ps) => ps.skill.id);
      const score = scoreSkillMatch(candidateSkills, requiredIds);
      const matchedSkills = project.skills
        .filter((ps) => candidateSkills.some((cs) => cs.skillId === ps.skill.id))
        .map((ps) => ps.skill.name);
      return { project, score, matchedSkills };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return matches;
}

export type CandidateMatch = {
  user: { id: string; name: string; bio: string | null };
  score: number;
  matchedSkills: string[];
};

/**
 * For a project owner: ranks other users by how well their skills cover the
 * project's required skills. Excludes the owner, existing team members, and
 * anyone who has already requested to join.
 */
export async function getCandidatesForProject(
  projectId: string,
  limit = 20,
): Promise<CandidateMatch[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      skills: { select: { skillId: true } },
      requests: { select: { requesterId: true } },
      team: { select: { members: { select: { userId: true } } } },
    },
  });
  if (!project) return [];

  const requiredIds = project.skills.map((s) => s.skillId);
  if (requiredIds.length === 0) return [];

  const excludeIds = new Set<string>([
    project.ownerId,
    ...project.requests.map((r) => r.requesterId),
    ...(project.team?.members.map((m) => m.userId) ?? []),
  ]);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      skills: { some: { skillId: { in: requiredIds } } },
    },
    select: {
      id: true,
      name: true,
      bio: true,
      skills: {
        select: { skillId: true, level: true, skill: { select: { name: true } } },
      },
    },
    take: 200,
  });

  const matches = users
    .map((user) => {
      const candidateSkills: SkillLevel[] = user.skills.map((s) => ({
        skillId: s.skillId,
        name: s.skill.name,
        level: s.level,
      }));
      const score = scoreSkillMatch(candidateSkills, requiredIds);
      const matchedSkills = candidateSkills
        .filter((s) => requiredIds.includes(s.skillId))
        .map((s) => s.name);
      return { user: { id: user.id, name: user.name, bio: user.bio }, score, matchedSkills };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return matches;
}
