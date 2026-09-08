"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  CollaborationRequestSchema,
  ProjectSchema,
  parseSkillList,
} from "@/lib/validation";

export type ProjectFormState =
  | {
      errors?: { title?: string[]; description?: string[]; skills?: string[] };
      message?: string;
    }
  | undefined;

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const { userId } = await verifySession();

  const validated = ProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    skills: formData.get("skills"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { title, description, skills } = validated.data;
  const skillNames = parseSkillList(skills);
  if (skillNames.length === 0) {
    return { errors: { skills: ["List at least one required skill."] } };
  }

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { title, description, ownerId: userId },
    });

    for (const skillName of skillNames) {
      const skill = await tx.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });
      await tx.projectSkill.create({
        data: { projectId: created.id, skillId: skill.id },
      });
    }

    return created;
  });

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export type RequestFormState = { message?: string } | undefined;

export async function requestToJoinAction(
  projectId: string,
  _prevState: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const { userId } = await verifySession();

  const validated = CollaborationRequestSchema.safeParse({
    message: formData.get("message") ?? undefined,
  });
  if (!validated.success) {
    return { message: "Message is too long." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, status: true },
  });
  if (!project) return { message: "Project not found." };
  if (project.ownerId === userId) {
    return { message: "You can't request to join your own project." };
  }
  if (project.status !== "OPEN") {
    return { message: "This project is no longer accepting requests." };
  }

  const existing = await prisma.collaborationRequest.findUnique({
    where: { projectId_requesterId: { projectId, requesterId: userId } },
  });
  if (existing) {
    return { message: "You've already requested to join this project." };
  }

  await prisma.collaborationRequest.create({
    data: {
      projectId,
      requesterId: userId,
      message: validated.data.message || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/matches");
  return { message: "Request sent." };
}

export async function respondToRequestAction(
  requestId: string,
  decision: "ACCEPTED" | "DECLINED",
) {
  const { userId } = await verifySession();

  const request = await prisma.collaborationRequest.findUnique({
    where: { id: requestId },
    include: { project: { select: { id: true, ownerId: true } } },
  });
  if (!request || request.project.ownerId !== userId) {
    throw new Error("Not authorized to respond to this request.");
  }
  if (request.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    await tx.collaborationRequest.update({
      where: { id: requestId },
      data: { status: decision },
    });

    if (decision === "ACCEPTED") {
      let team = await tx.team.findUnique({ where: { projectId: request.project.id } });
      if (!team) {
        team = await tx.team.create({ data: { projectId: request.project.id } });
        await tx.teamMember.create({
          data: { teamId: team.id, userId: request.project.ownerId, role: "OWNER" },
        });
        await tx.project.update({
          where: { id: request.project.id },
          data: { status: "IN_PROGRESS" },
        });
      }
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: request.requesterId } },
        update: {},
        create: { teamId: team.id, userId: request.requesterId, role: "MEMBER" },
      });
    }
  });

  revalidatePath(`/projects/${request.project.id}`);
}

export async function archiveProjectAction(projectId: string) {
  const { userId } = await verifySession();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project || project.ownerId !== userId) {
    throw new Error("Not authorized to archive this project.");
  }
  await prisma.project.update({ where: { id: projectId }, data: { status: "ARCHIVED" } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}
