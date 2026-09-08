import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Find developers who complement your skills.
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Post a project with the skills you need, get matched with developers who
          have them, and take the whole team from collaboration request to shipped
          feature — tasks and chat included.
        </p>
        <div className="mt-8 flex gap-3">
          {user ? (
            <>
              <Link href="/matches" className="btn-primary">
                See your matches
              </Link>
              <Link href="/projects/new" className="btn-secondary">
                Post a project
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
              <Link href="/projects" className="btn-secondary">
                Browse projects
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-20 grid gap-6 sm:grid-cols-3">
        <div className="card">
          <h2 className="font-semibold">Skill-based matching</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            List your skills and proficiency; DevMatch ranks open projects and
            candidates by real overlap, not keyword guessing.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold">Team workspaces</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Accepted collaborators get a shared workspace with a task board to
            track what&apos;s next.
          </p>
        </div>
        <div className="card">
          <h2 className="font-semibold">Real-time chat</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Every team gets a live chat room so coordination doesn&apos;t happen over
            five different apps.
          </p>
        </div>
      </div>
    </div>
  );
}
