import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AdminReportRow } from "./report-row";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { reporter: { select: { id: true, name: true } } },
  });

  const projectIds = reports.filter((r) => r.targetType === "PROJECT").map((r) => r.targetId);
  const messageIds = reports.filter((r) => r.targetType === "MESSAGE").map((r) => r.targetId);

  const [projects, messages] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true } }),
    prisma.message.findMany({
      where: { id: { in: messageIds } },
      select: { id: true, content: true, sender: { select: { name: true } } },
    }),
  ]);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const messageById = new Map(messages.map((m) => [m.id, m]));

  const openCount = reports.filter((r) => r.status === "OPEN").length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
        &larr; Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {openCount} open, {reports.length} total.
      </p>

      <div className="mt-6 space-y-3">
        {reports.length === 0 && <p className="text-sm text-zinc-500">No reports filed yet.</p>}
        {reports.map((r) => {
          const project = r.targetType === "PROJECT" ? projectById.get(r.targetId) : undefined;
          const message = r.targetType === "MESSAGE" ? messageById.get(r.targetId) : undefined;
          const target =
            r.targetType === "PROJECT"
              ? project
                ? { label: project.title, missing: false }
                : { label: "Project no longer exists", missing: true }
              : message
                ? { label: `"${message.content}" — ${message.sender.name}`, missing: false }
                : { label: "Message no longer exists", missing: true };

          return (
            <AdminReportRow
              key={r.id}
              report={{
                id: r.id,
                status: r.status,
                reason: r.reason,
                createdAt: r.createdAt,
                targetType: r.targetType,
                reporter: r.reporter,
                target,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
