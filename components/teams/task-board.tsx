"use client";

import { useActionState, useTransition } from "react";
import type { TaskPriority, TaskStatus } from "@prisma/client";
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
  priority: TaskPriority;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
};

export type TeamMemberOption = { id: string; name: string };

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "REVIEW", label: "Review" },
  { status: "DONE", label: "Done" },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  MEDIUM: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  HIGH: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
};

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

  const completed = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      <div className="card">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-zinc-500">
            {completed} / {total} tasks &middot; {progress}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-indigo-600 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form action={action} className="card mt-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="title" className="label">
            New task
          </label>
          <input id="title" name="title" className="input" placeholder="Wire up login form" required />
          {state?.errors?.title && <p className="field-error">{state.errors.title[0]}</p>}
        </div>
        <div className="w-40">
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
        <div className="w-32">
          <label htmlFor="priority" className="label">
            Priority
          </label>
          <select id="priority" name="priority" className="input" defaultValue="MEDIUM">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="dueDate" className="label">
            Due date
          </label>
          <input id="dueDate" name="dueDate" type="date" className="input" />
        </div>
        <SubmitButton className="btn-primary" pendingLabel="Adding...">
          Add task
        </SubmitButton>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function formatDueDate(dueDate: string) {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function TaskCard({ task }: { task: BoardTask }) {
  const [isPending, startTransition] = useTransition();

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "REVIEW",
    REVIEW: "DONE",
    DONE: "TODO",
  };
  const nextLabel: Record<TaskStatus, string> = {
    TODO: "Start",
    IN_PROGRESS: "Move to review",
    REVIEW: "Complete",
    DONE: "Reopen",
  };

  const isOverdue = task.dueDate && task.status !== "DONE" && new Date(task.dueDate) < new Date();

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-zinc-500">{task.description}</p>
      )}
      {task.assignee && (
        <p className="mt-2 text-xs text-zinc-500">Assigned to {task.assignee.name}</p>
      )}
      {task.dueDate && (
        <p className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>
          Due {formatDueDate(task.dueDate)}
          {isOverdue ? " (overdue)" : ""}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => updateTaskStatusAction(task.id, nextStatus[task.status]))
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
