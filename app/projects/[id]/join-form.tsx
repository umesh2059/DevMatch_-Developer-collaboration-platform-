"use client";

import { useActionState } from "react";
import { requestToJoinAction, type RequestFormState } from "@/app/actions/projects";
import { SubmitButton } from "@/components/submit-button";

const initialState: RequestFormState = undefined;

export function JoinForm({ projectId }: { projectId: string }) {
  const boundAction = requestToJoinAction.bind(null, projectId);
  const [state, action] = useActionState(boundAction, initialState);

  return (
    <form action={action} className="card space-y-3">
      <label htmlFor="message" className="label">
        Request to join
      </label>
      <textarea
        id="message"
        name="message"
        rows={3}
        className="input"
        placeholder="Say a bit about why you'd be a good fit (optional)"
      />
      {state?.message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</p>}
      <SubmitButton className="btn-primary" pendingLabel="Sending...">
        Send request
      </SubmitButton>
    </form>
  );
}
