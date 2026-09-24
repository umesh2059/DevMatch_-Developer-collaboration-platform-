import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCandidatesForProject } from "@/lib/matching";
import { JoinForm } from "./join-form";
import { RespondButtons } from "./respond-buttons";
import { ReportProjectForm } from "./report-form";
import { Avatar } from "@/components/avatar";

export const dynamic = "force-dynamic";

const REQUEST_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  ACCEPTED: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  DECLINED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const PROJECT_STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  IN_PROGRESS: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  COMPLETED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  ARCHIVED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}
    >
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}

export default async function ProjectDetailPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      skills: { select: { skill: { select: { id: true, name: true } } } },
      requests: {
        orderBy: { createdAt: "desc" },
        include: { requester: { select: { id: true, name: true, bio: true, avatarUrl: true } } },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold break-words">{project.title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Avatar name={project.owner.name} avatarUrl={project.owner.avatarUrl} size={18} />
              by {project.owner.name}
            </span>
            <StatusBadge status={project.status} styles={PROJECT_STATUS_STYLES} />
          </p>
        </div>
        {project.team && (isOwner || isMember) && (
          <Link href={`/teams/${project.team.id}`} className="btn-secondary w-full shrink-0 sm:w-auto">
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
            <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              Your request is <StatusBadge status={myRequest.status} styles={REQUEST_STATUS_STYLES} />
            </p>
          )}
          {user && !isMember && !myRequest && project.status === "OPEN" && (
            <JoinForm projectId={project.id} />
          )}
          {user && (
            <div className="mt-6">
              <ReportProjectForm projectId={project.id} />
            </div>
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
                <div key={r.id} className="card transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-medium">
                      <Avatar name={r.requester.name} avatarUrl={r.requester.avatarUrl} size={22} />
                      {r.requester.name}
                    </span>
                    {r.status === "PENDING" ? (
                      <RespondButtons requestId={r.id} />
                    ) : (
                      <StatusBadge status={r.status} styles={REQUEST_STATUS_STYLES} />
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
                <div key={c.user.id} className="card transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">
                      <Avatar name={c.user.name} avatarUrl={c.user.avatarUrl} size={22} />
                      {c.user.name}
                    </span>
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
