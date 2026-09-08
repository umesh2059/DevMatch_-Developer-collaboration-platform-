import Link from "next/link";
import { requireCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  const [ownedProjects, memberships, sentRequests] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        _count: { select: { requests: { where: { status: "PENDING" } } } },
      },
    }),
    prisma.teamMember.findMany({
      where: { userId: user.id },
      select: {
        team: {
          select: {
            id: true,
            project: { select: { id: true, title: true, ownerId: true } },
          },
        },
      },
    }),
    prisma.collaborationRequest.findMany({
      where: { requesterId: user.id, status: "PENDING" },
      select: { id: true, project: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Your projects</h2>
            <Link href="/projects/new" className="text-sm text-indigo-600 hover:underline">
              + New project
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {ownedProjects.length === 0 && (
              <p className="text-sm text-zinc-500">
                You haven&apos;t posted a project yet.
              </p>
            )}
            {ownedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card block hover:border-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{project.title}</span>
                  <span className="badge">{project.status}</span>
                </div>
                {project._count.requests > 0 && (
                  <p className="mt-1 text-sm text-indigo-600">
                    {project._count.requests} pending request
                    {project._count.requests > 1 ? "s" : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium">Your teams</h2>
          <div className="mt-4 space-y-3">
            {memberships.length === 0 && (
              <p className="text-sm text-zinc-500">
                No teams yet. Join a project to get a workspace here.
              </p>
            )}
            {memberships.map((m) => (
              <Link
                key={m.team.id}
                href={`/teams/${m.team.id}`}
                className="card block hover:border-indigo-400"
              >
                <span className="font-medium">{m.team.project.title}</span>
              </Link>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-medium">Requests you&apos;ve sent</h2>
          <div className="mt-4 space-y-3">
            {sentRequests.length === 0 && (
              <p className="text-sm text-zinc-500">Nothing pending.</p>
            )}
            {sentRequests.map((r) => (
              <Link
                key={r.id}
                href={`/projects/${r.project.id}`}
                className="card block hover:border-indigo-400"
              >
                <span className="font-medium">{r.project.title}</span>
                <span className="ml-2 badge">Pending</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
