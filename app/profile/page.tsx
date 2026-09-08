import { requireCurrentUser } from "@/lib/dal";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireCurrentUser();

  const skillsValue = user.skills
    .map((s) => `${s.skill.name}:${s.level}`)
    .join(", ");

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold">Your profile</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
      <ProfileForm name={user.name} bio={user.bio ?? ""} skillsValue={skillsValue} />
    </div>
  );
}
