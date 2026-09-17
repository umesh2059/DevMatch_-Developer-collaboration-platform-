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

function useAdminUserActions(user: AdminUserRowData) {
  const [isPending, startTransition] = useTransition();

  const toggleRole = () =>
    startTransition(() =>
      setUserRoleAction(user.id, user.role === "ADMIN" ? "USER" : "ADMIN"),
    );

  const remove = () => {
    if (confirm(`Delete ${user.name}? This can't be undone.`)) {
      startTransition(() => deleteUserAction(user.id));
    }
  };

  return { isPending, toggleRole, remove };
}

export function AdminUserRow({ user, isSelf }: { user: AdminUserRowData; isSelf: boolean }) {
  const { isPending, toggleRole, remove } = useAdminUserActions(user);

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
              onClick={toggleRole}
              className="btn-secondary !px-2.5 !py-1 text-xs"
            >
              {user.role === "ADMIN" ? "Demote" : "Make admin"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={remove}
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

// Card layout used on narrow screens where a scrolling table is awkward.
export function AdminUserCard({ user, isSelf }: { user: AdminUserRowData; isSelf: boolean }) {
  const { isPending, toggleRole, remove } = useAdminUserActions(user);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-zinc-500">{user.email}</p>
        </div>
        <span className="badge shrink-0">{user.role}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>{user._count.ownedProjects} projects</span>
        <span>{user._count.skills} skills</span>
        <span>Joined {user.createdAt.toLocaleDateString()}</span>
      </div>
      <div className="mt-3">
        {isSelf ? (
          <span className="text-xs text-zinc-400">You</span>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={toggleRole}
              className="btn-secondary !px-2.5 !py-1 text-xs"
            >
              {user.role === "ADMIN" ? "Demote" : "Make admin"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={remove}
              className="btn-secondary !px-2.5 !py-1 text-xs text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
