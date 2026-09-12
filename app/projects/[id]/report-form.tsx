"use client";

import { useActionState, useState } from "react";
import { reportProjectAction, type ReportFormState } from "@/app/actions/reports";
import { SubmitButton } from "@/components/submit-button";

const initialState: ReportFormState = undefined;

export function ReportProjectForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = reportProjectAction.bind(null, projectId);
  const [state, action] = useActionState(boundAction, initialState);

  if (state?.message) {
    return <p className="text-sm text-zinc-500">{state.message}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
      >
        Report this project
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-2">
      <label htmlFor="reason" className="label">
        What&apos;s wrong with this project?
      </label>
      <textarea id="reason" name="reason" rows={2} className="input" required minLength={3} />
      {state?.error && <p className="field-error">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton className="btn-secondary !px-3 !py-1.5 text-xs" pendingLabel="Sending...">
          Submit report
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
