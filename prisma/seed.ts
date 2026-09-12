// Seeds a handful of demo users, skills, and an open project so the app has
// something to look at right after `npm run db:migrate`.
// Run with: npm run db:seed
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const DEMO_PASSWORD = "password123";

async function upsertUserWithSkills(
  email: string,
  name: string,
  bio: string,
  skills: { name: string; level: number }[],
  role: "USER" | "ADMIN" = "USER",
) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, bio, passwordHash, role },
  });

  for (const { name: skillName, level } of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: user.id, skillId: skill.id } },
      update: { level },
      create: { userId: user.id, skillId: skill.id, level },
    });
  }

  return user;
}

async function main() {
  const asha = await upsertUserWithSkills(
    "asha@example.com",
    "Asha Patel",
    "Full-stack developer who loves clean APIs and even cleaner CSS.",
    [
      { name: "TypeScript", level: 5 },
      { name: "React", level: 5 },
      { name: "Node.js", level: 4 },
      { name: "PostgreSQL", level: 3 },
    ],
  );

  await upsertUserWithSkills(
    "marco@example.com",
    "Marco Rossi",
    "Backend engineer, ex-fintech. Into distributed systems and coffee.",
    [
      { name: "Node.js", level: 5 },
      { name: "PostgreSQL", level: 5 },
      { name: "Docker", level: 4 },
      { name: "TypeScript", level: 3 },
    ],
  );

  await upsertUserWithSkills(
    "priya@example.com",
    "Priya Nair",
    "Product-minded designer who codes. Figma in one tab, VS Code in the other.",
    [
      { name: "UI/UX Design", level: 5 },
      { name: "React", level: 3 },
      { name: "Figma", level: 5 },
    ],
  );

  await upsertUserWithSkills("admin@example.com", "Admin User", "Platform admin.", [], "ADMIN");

  const project = await prisma.project.upsert({
    where: { id: "seed-project-devmatch-mobile" },
    update: {},
    create: {
      id: "seed-project-devmatch-mobile",
      title: "DevMatch Mobile Companion",
      description:
        "Building a lightweight React Native app so members can browse matches and chat with their team on the go. Looking for a backend hand and someone comfortable with real-time features.",
      ownerId: asha.id,
      status: "OPEN",
    },
  });

  for (const skillName of ["React", "Node.js", "PostgreSQL"]) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
    await prisma.projectSkill.upsert({
      where: { projectId_skillId: { projectId: project.id, skillId: skill.id } },
      update: {},
      create: { projectId: project.id, skillId: skill.id },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo accounts (password: ${DEMO_PASSWORD}):`);
  console.log("  asha@example.com / marco@example.com / priya@example.com");
  console.log("  admin@example.com (admin - has access to /admin)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
