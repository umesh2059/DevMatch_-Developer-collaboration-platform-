"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ProfileSchema, parseSkillLevels } from "@/lib/validation";
import { deleteAvatarFile, saveAvatarFile, validateAvatarFile } from "@/lib/avatar";

export type ProfileFormState =
  | {
      errors?: { name?: string[]; bio?: string[]; skills?: string[]; avatar?: string[] };
      message?: string;
    }
  | undefined;

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { userId } = await verifySession();

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
    skills: formData.get("skills") ?? "",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const avatarFile = formData.get("avatar");
  let avatarUrl: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const avatarError = validateAvatarFile(avatarFile);
    if (avatarError) {
      return { errors: { avatar: [avatarError] } };
    }
    avatarUrl = await saveAvatarFile(userId, avatarFile);
  }

  const { name, bio, skills } = validated.data;
  const parsedSkills = parseSkillLevels(skills);

  const previous = avatarUrl
    ? await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name, bio: bio || null, ...(avatarUrl ? { avatarUrl } : {}) },
    });

    // Replace the user's skill set with what was submitted.
    await tx.userSkill.deleteMany({ where: { userId } });

    for (const { name: skillName, level } of parsedSkills) {
      const skill = await tx.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });
      await tx.userSkill.create({
        data: { userId, skillId: skill.id, level },
      });
    }
  });

  if (avatarUrl && previous?.avatarUrl) {
    await deleteAvatarFile(previous.avatarUrl);
  }

  revalidatePath("/profile");
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return { message: "Profile updated." };
}

export async function removeAvatarAction() {
  const { userId } = await verifySession();

  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  if (previous?.avatarUrl) {
    await deleteAvatarFile(previous.avatarUrl);
  }

  revalidatePath("/profile");
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}
