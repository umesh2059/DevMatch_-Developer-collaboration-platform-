"use client";

import { useTransition } from "react";
import { setUserRoleAction, deleteUserAction } from "@/app/actions/admin";
import type { Role } from "@prisma/client";

export type AdminUserRowData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  _count: { ownedProjects: number; skills: number };
};

export function AdminUserRow({ user, isSelf }: { user: AdminUserRowData; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-900">
      <td className="py-2 pr-4">{user.name}</td>
      <td className="py-2 pr-4 text-zinc-500">{user.email}</td>
      <td className="py-2 pr-4">
        <span className="badge">{user.role}</span>
      </td>
      <td className="py-2 pr-4">{user._count.ownedProjects}</td>
      <td className="py-2 pr-4">{user._count.skills}</td>
      <td className="py-2 pr-4 text-zinc-500">{user.createdAt.toLocaleDateString()}</td>
      <td className="py-2">
        {isSelf ? (
          <span className="text-xs text-zinc-400">You</span>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() =>
                  setUserRoleAction(user.id, user.role === "ADMIN" ? "USER" : "ADMIN"),
                )
              }
              className="btn-secondary !px-2.5 !py-1 text-xs"
            >
              {user.role === "ADMIN" ? "Demote" : "Make admin"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (confirm(`Delete ${user.name}? This can't be undone.`)) {
                  startTransition(() => deleteUserAction(user.id));
                }
              }}
              className="btn-secondary !px-2.5 !py-1 text-xs text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
