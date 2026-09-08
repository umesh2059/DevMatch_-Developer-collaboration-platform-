"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { requireTeamMembership } from "@/lib/teams";
import { TaskSchema } from "@/lib/validation";
import type { TaskStatus } from "@prisma/client";

export type TaskFormState = { errors?: { title?: string[] }; message?: string } | undefined;

export async function createTaskAction(
  teamId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const { userId } = await verifySession();
  await requireTeamMembership(teamId, userId);

  const validated = TaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    assigneeId: formData.get("assigneeId") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { title, description, assigneeId } = validated.data;

  if (assigneeId) {
    await requireTeamMembership(teamId, assigneeId);
  }

  await prisma.task.create({
    data: { teamId, title, description: description || null, assigneeId: assigneeId || null },
  });

  revalidatePath(`/teams/${teamId}`);
  return { message: "Task created." };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const { userId } = await verifySession();
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { teamId: true } });
  if (!task) throw new Error("Task not found.");
  await requireTeamMembership(task.teamId, userId);

  await prisma.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath(`/teams/${task.teamId}`);
}

export async function deleteTaskAction(taskId: string) {
  const { userId } = await verifySession();
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { teamId: true } });
  if (!task) return;
  await requireTeamMembership(task.teamId, userId);

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/teams/${task.teamId}`);
}
