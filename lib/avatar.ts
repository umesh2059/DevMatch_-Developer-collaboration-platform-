import "server-only";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const AVATAR_URL_PREFIX = "/uploads/avatars/";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

/** Returns an error message if the file isn't a usable avatar, or null if it's fine. */
export function validateAvatarFile(file: File): string | null {
  if (!(file.type in ALLOWED_TYPES)) {
    return "Photo must be a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Photo must be under 2MB.";
  }
  return null;
}

/** Writes the file under public/uploads/avatars and returns its public URL path. */
export async function saveAvatarFile(userId: string, file: File): Promise<string> {
  await mkdir(AVATAR_DIR, { recursive: true });
  const ext = ALLOWED_TYPES[file.type];
  const filename = `${userId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATAR_DIR, filename), buffer);
  return `${AVATAR_URL_PREFIX}${filename}`;
}

/** Deletes a previously saved avatar file, ignoring URLs we didn't generate. */
export async function deleteAvatarFile(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) return;
  const filename = avatarUrl.slice(AVATAR_URL_PREFIX.length);
  await unlink(path.join(AVATAR_DIR, filename)).catch(() => {});
}
