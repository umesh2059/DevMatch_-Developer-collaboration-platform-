import Link from "next/link";
import { requireCurrentUser } from "@/lib/dal";
import { getProjectMatchesForUser } from "@/lib/matching";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireCurrentUser();
  const matches = await getProjectMatchesForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Your matches</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Ranked by how well your skills cover each project&apos;s requirements.
      </p>

      {user.skills.length === 0 && (
        <p className="mt-6 text-sm text-amber-600">
          Add skills to your{" "}
          <Link href="/profile" className="underline">
            profile
          </Link>{" "}
          to start getting matched.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {matches.length === 0 && user.skills.length > 0 && (
          <p className="text-sm text-zinc-500">
            No matches right now — check back as more projects are posted.
          </p>
        )}
        {matches.map(({ project, score, matchedSkills }) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="card block hover:border-indigo-400"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{project.title}</h2>
              <span className="badge">{score}% match</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">by {project.owner.name}</p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {project.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span
                  key={s.skill.id}
                  className={
                    matchedSkills.includes(s.skill.name)
                      ? "badge"
                      : "badge !bg-zinc-100 !text-zinc-500 dark:!bg-zinc-800 dark:!text-zinc-400"
                  }
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
