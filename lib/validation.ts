import * as z from "zod";

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export const LoginSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  bio: z.string().trim().max(500, "Bio must be under 500 characters.").optional(),
  skills: z
    .string()
    .trim()
    .max(300, "Keep the skills list under 300 characters."),
});

export const ProjectSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters long."),
  skills: z
    .string()
    .trim()
    .min(1, "List at least one required skill."),
});

export const CollaborationRequestSchema = z.object({
  message: z.string().trim().max(500, "Keep your message under 500 characters.").optional(),
});

export const TaskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters long."),
  description: z.string().trim().max(1000).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Enter a valid due date.")
    .optional(),
});

export const ReportSchema = z.object({
  targetType: z.enum(["PROJECT", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3, "Say a bit more about the issue.").max(500),
});

export const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

/** Splits a comma-separated skills string into a clean, deduped list of names. */
export function parseSkillList(raw: string): string[] {
  return parseSkillLevels(raw).map((s) => s.name);
}

/**
 * Parses a comma-separated skills string, where each entry may optionally
 * carry a proficiency level after a colon, e.g. "React:4, Node.js, Figma:2".
 * Skills without an explicit level default to 3 (mid-level). Levels are
 * clamped to 1-5.
 */
export function parseSkillLevels(raw: string): { name: string; level: number }[] {
  const seen = new Set<string>();
  const result: { name: string; level: number }[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [namePart, levelPart] = trimmed.split(":").map((s) => s.trim());
    if (!namePart) continue;

    const key = namePart.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    let level = 3;
    if (levelPart) {
      const parsed = Number.parseInt(levelPart, 10);
      if (!Number.isNaN(parsed)) level = Math.min(5, Math.max(1, parsed));
    }

    result.push({ name: namePart, level });
  }
  return result;
}
