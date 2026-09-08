import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { TaskBoard } from "@/components/teams/task-board";
import { Chat } from "@/components/teams/chat";

export const dynamic = "force-dynamic";

export default async function TeamWorkspacePage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const user = await requireCurrentUser();

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true, description: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: { assignee: { select: { id: true, name: true } } },
      },
    },
  });

  if (!team) notFound();

  const isMember = team.members.some((m) => m.userId === user.id);
  if (!isMember) notFound();

  const messages = await prisma.message.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { sender: { select: { id: true, name: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href={`/projects/${team.project.id}`} className="text-sm text-indigo-600 hover:underline">
        &larr; {team.project.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{team.project.title} — Workspace</h1>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {team.members.map((m) => (
          <span key={m.userId} className="badge">
            {m.user.name}
            {m.role === "OWNER" ? " (owner)" : ""}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <TaskBoard
          teamId={team.id}
          tasks={team.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            assignee: t.assignee,
          }))}
          members={team.members.map((m) => m.user)}
        />

        <Chat
          teamId={team.id}
          currentUserId={user.id}
          initialMessages={messages.map((m) => ({
            id: m.id,
            teamId: m.teamId,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            sender: m.sender,
          }))}
        />
      </div>
    </div>
  );
}
