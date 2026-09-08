"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/app/actions/profile";
import { SubmitButton } from "@/components/submit-button";

const initialState: ProfileFormState = undefined;

type Props = {
  name: string;
  bio: string;
  skillsValue: string;
};

export function ProfileForm({ name, bio, skillsValue }: Props) {
  const [state, action] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Name
        </label>
        <input id="name" name="name" defaultValue={name} className="input" required />
        {state?.errors?.name && <p className="field-error">{state.errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="bio" className="label">
          Bio
        </label>
        <textarea id="bio" name="bio" defaultValue={bio} rows={4} className="input" />
        {state?.errors?.bio && <p className="field-error">{state.errors.bio[0]}</p>}
      </div>

      <div>
        <label htmlFor="skills" className="label">
          Skills
        </label>
        <textarea
          id="skills"
          name="skills"
          defaultValue={skillsValue}
          rows={3}
          className="input"
          placeholder="React:4, Node.js:3, PostgreSQL:2"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Comma-separated. Add a proficiency level 1-5 with a colon (defaults to 3).
        </p>
        {state?.errors?.skills && <p className="field-error">{state.errors.skills[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-green-600">{state.message}</p>}

      <SubmitButton className="btn-primary" pendingLabel="Saving...">
        Save profile
      </SubmitButton>
    </form>
  );
}
