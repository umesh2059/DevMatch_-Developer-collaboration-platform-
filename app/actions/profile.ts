"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ProfileSchema, parseSkillLevels } from "@/lib/validation";

export type ProfileFormState =
  | {
      errors?: { name?: string[]; bio?: string[]; skills?: string[] };
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

  const { name, bio, skills } = validated.data;
  const parsedSkills = parseSkillLevels(skills);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name, bio: bio || null },
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

  revalidatePath("/profile");
  revalidatePath("/matches");
  return { message: "Profile updated." };
}
