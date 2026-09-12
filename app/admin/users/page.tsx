import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AdminUserRow } from "./user-row";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { ownedProjects: true, skills: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
        &larr; Admin
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Manage users</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {users.length} registered user{users.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Projects</th>
              <th className="py-2 pr-4 font-medium">Skills</th>
              <th className="py-2 pr-4 font-medium">Joined</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <AdminUserRow key={u.id} user={u} isSelf={u.id === admin.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
