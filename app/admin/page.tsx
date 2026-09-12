import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status.replace("_", " ").toLowerCase();
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    userCount,
    adminCount,
    projectsByStatus,
    teamCount,
    taskCounts,
    requestsByStatus,
    openReportCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.team.count(),
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.collaborationRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  const totalProjects = projectsByStatus.reduce((sum, p) => sum + p._count._all, 0);
  const totalTasks = taskCounts.reduce((sum, t) => sum + t._count._all, 0);
  const completedTasks = taskCounts.find((t) => t.status === "DONE")?._count._all ?? 0;
  const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const totalRequests = requestsByStatus.reduce((sum, r) => sum + r._count._all, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/users" className="text-indigo-600 hover:underline">
            Users
          </Link>
          <Link href="/admin/projects" className="text-indigo-600 hover:underline">
            Projects
          </Link>
          <Link href="/admin/reports" className="text-indigo-600 hover:underline">
            Reports{openReportCount > 0 ? ` (${openReportCount})` : ""}
          </Link>
        </nav>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={userCount}
          hint={`${adminCount} admin${adminCount === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Projects"
          value={totalProjects}
          hint={
            projectsByStatus.map((p) => `${p._count._all} ${statusLabel(p.status)}`).join(", ") ||
            "none yet"
          }
        />
        <StatCard label="Teams" value={teamCount} />
        <StatCard
          label="Collaboration requests"
          value={totalRequests}
          hint={
            requestsByStatus.map((r) => `${r._count._all} ${statusLabel(r.status)}`).join(", ") ||
            "none yet"
          }
        />
      </div>

      <div className="card mt-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Tasks completed across all teams</span>
          <span className="text-zinc-500">
            {completedTasks} / {totalTasks} &middot; {taskProgress}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width]"
            style={{ width: `${taskProgress}%` }}
          />
        </div>
      </div>

      {openReportCount > 0 && (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          {openReportCount} open report{openReportCount === 1 ? "" : "s"} awaiting review.{" "}
          <Link href="/admin/reports" className="font-medium underline">
            Review now
          </Link>
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
