"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setProjectStatusAction, deleteProjectAction } from "@/app/actions/admin";
import type { ProjectStatus } from "@prisma/client";

export type AdminProjectData = {
  id: string;
  title: string;
  status: ProjectStatus;
  owner: { id: string; name: string };
  _count: { requests: number };
  team: { id: string } | null;
};

const STATUSES: ProjectStatus[] = ["OPEN", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];

export function AdminProjectRow({ project }: { project: AdminProjectData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
          {project.title}
        </Link>
        <p className="text-xs text-zinc-500">
          by {project.owner.name} &middot; {project._count.requests} request
          {project._count.requests === 1 ? "" : "s"}
          {project.team ? " · has a team" : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={project.status}
          disabled={isPending}
          onChange={(e) =>
            startTransition(() =>
              setProjectStatusAction(project.id, e.target.value as ProjectStatus),
            )
          }
          className="input !w-auto !py-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (
              confirm(
                `Permanently delete "${project.title}"? This also removes its team, tasks, and chat history.`,
              )
            ) {
              startTransition(() => deleteProjectAction(project.id));
            }
          }}
          className="btn-secondary !px-2.5 !py-1 text-xs text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
