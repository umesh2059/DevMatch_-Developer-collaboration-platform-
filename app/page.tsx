import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
          Find developers who complement your skills.
        </h1>
        <p className="mt-4 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
          Post a project with the skills you need, get matched with developers who
          have them, and take the whole team from collaboration request to shipped
          feature — tasks and chat included.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

      {/* Stats strip */}
      <div className="mt-14 grid grid-cols-2 gap-6 border-y border-zinc-200 py-6 sm:grid-cols-4 dark:border-zinc-800">
        {[
          { value: "Skill-ranked", label: "Matching, not keyword search" },
          { value: "Live", label: "Team chat, no extra app" },
          { value: "Built-in", label: "Task boards per team" },
          { value: "Free", label: "To post and browse" },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* How it works */}
      <div className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Post or browse",
              body: "Share a project with the skills you need, or browse open projects looking for someone like you.",
            },
            {
              step: "2",
              title: "Request to collaborate",
              body: "Send a collaboration request. Owners see your skill overlap up front, so replies come faster.",
            },
            {
              step: "3",
              title: "Ship as a team",
              body: "Accepted requests spin up a shared workspace with tasks and chat — everything stays in one place.",
            },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {item.step}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="mt-20 flex flex-col items-start gap-4 rounded-lg border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Ready to find your next collaborator?
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user
              ? "Check your matches or post a new project to get started."
              : "Create a profile, list your skills, and start matching in minutes."}
          </p>
        </div>
        {user ? (
          <Link href="/matches" className="btn-primary w-full sm:w-auto">
            See your matches
          </Link>
        ) : (
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Get started
          </Link>
        )}
      </div>
    </div>
  );
}
