import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AdminProjectRow } from "./project-row";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await requireAdmin();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { requests: true } },
      team: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
        &larr; Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Manage projects</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {projects.length} project{projects.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 space-y-3">
        {projects.length === 0 && <p className="text-sm text-zinc-500">No projects yet.</p>}
        {projects.map((p) => (
          <AdminProjectRow key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
