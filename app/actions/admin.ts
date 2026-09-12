"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/dal";
import type { ProjectStatus, Role } from "@prisma/client";

export async function setUserRoleAction(userId: string, role: Role) {
  const admin = await requireAdminSession();
  if (userId === admin.userId) throw new Error("You can't change your own role.");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdminSession();
  if (userId === admin.userId) throw new Error("You can't delete your own account.");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function setProjectStatusAction(projectId: string, status: ProjectStatus) {
  await requireAdminSession();

  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath("/admin/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(projectId: string) {
  await requireAdminSession();

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/admin");
}

export async function dismissReportAction(reportId: string) {
  await requireAdminSession();

  await prisma.report.update({
    where: { id: reportId },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });
  revalidatePath("/admin/reports");
}

/**
 * Removes the reported content - archives a reported project (soft, keeps
 * its team/chat history intact) or deletes a reported chat message (hard,
 * it's a single line) - and marks the report resolved. Either delete is
 * swallowed if the content was already removed by the time this runs.
 */
export async function removeReportedContentAction(reportId: string) {
  await requireAdminSession();

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return;

  if (report.targetType === "PROJECT") {
    await prisma.project
      .update({ where: { id: report.targetId }, data: { status: "ARCHIVED" } })
      .catch(() => {});
  } else {
    await prisma.message.delete({ where: { id: report.targetId } }).catch(() => {});
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  revalidatePath("/admin/reports");
  revalidatePath("/admin/projects");
}
