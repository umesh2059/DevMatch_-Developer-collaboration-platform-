import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCandidatesForProject } from "@/lib/matching";
import { JoinForm } from "./join-form";
import { RespondButtons } from "./respond-buttons";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      skills: { select: { skill: { select: { id: true, name: true } } } },
      requests: {
        orderBy: { createdAt: "desc" },
        include: { requester: { select: { id: true, name: true, bio: true } } },
      },
      team: { select: { id: true, members: { select: { userId: true } } } },
    },
  });

  if (!project) notFound();

  const isOwner = user?.id === project.ownerId;
  const myRequest = user ? project.requests.find((r) => r.requesterId === user.id) : undefined;
  const isMember = user
    ? project.team?.members.some((m) => m.userId === user.id) ?? false
    : false;

  const candidates = isOwner ? await getCandidatesForProject(project.id) : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            by {project.owner.name} &middot; {project.status.replace("_", " ").toLowerCase()}
          </p>
        </div>
        {project.team && (isOwner || isMember) && (
          <Link href={`/teams/${project.team.id}`} className="btn-secondary shrink-0">
            Open workspace
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.skills.map((s) => (
          <span key={s.skill.id} className="badge">
            {s.skill.name}
          </span>
        ))}
      </div>

      <p className="mt-6 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
        {project.description}
      </p>

      {!isOwner && (
        <div className="mt-10">
          {!user && (
            <p className="text-sm text-zinc-500">
              <Link href="/login" className="text-indigo-600 hover:underline">
                Log in
              </Link>{" "}
              to request to join this project.
            </p>
          )}
          {user && isMember && (
            <p className="text-sm text-green-600">You&apos;re already on this team.</p>
          )}
          {user && !isMember && myRequest && (
            <p className="text-sm text-zinc-500">
              Your request is <span className="badge">{myRequest.status}</span>
            </p>
          )}
          {user && !isMember && !myRequest && project.status === "OPEN" && (
            <JoinForm projectId={project.id} />
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-10 space-y-10">
          <section>
            <h2 className="text-lg font-medium">Collaboration requests</h2>
            <div className="mt-4 space-y-3">
              {project.requests.length === 0 && (
                <p className="text-sm text-zinc-500">No requests yet.</p>
              )}
              {project.requests.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.requester.name}</span>
                    {r.status === "PENDING" ? (
                      <RespondButtons requestId={r.id} />
                    ) : (
                      <span className="badge">{r.status}</span>
                    )}
                  </div>
                  {r.message && (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.message}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">Suggested candidates</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Developers whose skills best match this project&apos;s requirements.
            </p>
            <div className="mt-4 space-y-3">
              {candidates.length === 0 && (
                <p className="text-sm text-zinc-500">No matches yet.</p>
              )}
              {candidates.map((c) => (
                <div key={c.user.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.user.name}</span>
                    <span className="badge">{c.score}% match</span>
                  </div>
                  {c.user.bio && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.user.bio}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.matchedSkills.map((s) => (
                      <span key={s} className="badge">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
