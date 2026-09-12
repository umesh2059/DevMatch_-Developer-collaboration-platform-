"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ReportSchema } from "@/lib/validation";
import type { ReportTargetType } from "@prisma/client";

async function fileReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
): Promise<{ message?: string; error?: string }> {
  const validated = ReportSchema.safeParse({ targetType, targetId, reason });
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors.reason?.[0] ?? "Invalid report." };
  }

  if (targetType === "PROJECT") {
    const exists = await prisma.project.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!exists) return { error: "That project no longer exists." };
  } else {
    const exists = await prisma.message.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!exists) return { error: "That message no longer exists." };
  }

  await prisma.report.create({
    data: { reporterId, targetType, targetId, reason: validated.data.reason },
  });
  revalidatePath("/admin/reports");
  return { message: "Reported. Thanks — our team will take a look." };
}

export type ReportFormState = { message?: string; error?: string } | undefined;

/** Form-based report action, used on the project page. */
export async function reportProjectAction(
  projectId: string,
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const { userId } = await verifySession();
  return fileReport(userId, "PROJECT", projectId, String(formData.get("reason") ?? ""));
}

/** Direct-call report action, used by the chat message report button. */
export async function reportMessageAction(messageId: string, reason: string) {
  const { userId } = await verifySession();
  return fileReport(userId, "MESSAGE", messageId, reason);
}
