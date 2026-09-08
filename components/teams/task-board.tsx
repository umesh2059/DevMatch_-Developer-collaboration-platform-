"use client";

import { useActionState, useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskStatusAction,
  type TaskFormState,
} from "@/app/actions/tasks";
import { SubmitButton } from "@/components/submit-button";

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: { id: string; name: string } | null;
};

export type TeamMemberOption = { id: string; name: string };

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "DONE", label: "Done" },
];

const initialState: TaskFormState = undefined;

export function TaskBoard({
  teamId,
  tasks,
  members,
}: {
  teamId: string;
  tasks: BoardTask[];
  members: TeamMemberOption[];
}) {
  const boundCreate = createTaskAction.bind(null, teamId);
  const [state, action] = useActionState(boundCreate, initialState);

  return (
    <div>
      <form action={action} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="title" className="label">
            New task
          </label>
          <input id="title" name="title" className="input" placeholder="Wire up login form" required />
          {state?.errors?.title && <p className="field-error">{state.errors.title[0]}</p>}
        </div>
        <div className="w-44">
          <label htmlFor="assigneeId" className="label">
            Assignee
          </label>
          <select id="assigneeId" name="assigneeId" className="input" defaultValue="">
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="btn-primary" pendingLabel="Adding...">
          Add task
        </SubmitButton>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.status}>
            <h3 className="text-sm font-medium text-zinc-500">{column.label}</h3>
            <div className="mt-2 space-y-2">
              {tasks
                .filter((t) => t.status === column.status)
                .map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: BoardTask }) {
  const [isPending, startTransition] = useTransition();

  const nextStatus: Partial<Record<TaskStatus, TaskStatus>> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "TODO",
  };
  const nextLabel: Record<TaskStatus, string> = {
    TODO: "Start",
    IN_PROGRESS: "Complete",
    DONE: "Reopen",
  };

  return (
    <div className="card">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description && (
        <p className="mt-1 text-xs text-zinc-500">{task.description}</p>
      )}
      {task.assignee && (
        <p className="mt-2 text-xs text-zinc-500">Assigned to {task.assignee.name}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => updateTaskStatusAction(task.id, nextStatus[task.status]!))
          }
          className="btn-secondary !px-2.5 !py-1 text-xs"
        >
          {nextLabel[task.status]}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteTaskAction(task.id))}
          className="btn-secondary !px-2.5 !py-1 text-xs text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
