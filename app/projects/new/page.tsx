"use client";

import { useActionState } from "react";
import { createProjectAction, type ProjectFormState } from "@/app/actions/projects";
import { SubmitButton } from "@/components/submit-button";

const initialState: ProjectFormState = undefined;

export default function NewProjectPage() {
  const [state, action] = useActionState(createProjectAction, initialState);

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold">Post a project</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Describe what you&apos;re building and the skills you need. DevMatch will surface
        it to developers whose skills match.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input id="title" name="title" className="input" placeholder="DevMatch Mobile Companion" required />
          {state?.errors?.title && <p className="field-error">{state.errors.title[0]}</p>}
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            className="input"
            placeholder="What are you building, and what does a collaborator's first two weeks look like?"
            required
          />
          {state?.errors?.description && (
            <p className="field-error">{state.errors.description[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="skills" className="label">
            Required skills
          </label>
          <input
            id="skills"
            name="skills"
            className="input"
            placeholder="React, Node.js, PostgreSQL"
            required
          />
          <p className="mt-1 text-xs text-zinc-500">Comma-separated.</p>
          {state?.errors?.skills && <p className="field-error">{state.errors.skills[0]}</p>}
        </div>

        <SubmitButton className="btn-primary" pendingLabel="Publishing...">
          Publish project
        </SubmitButton>
      </form>
    </div>
  );
}
