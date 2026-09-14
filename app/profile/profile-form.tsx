"use client";

import { useActionState, useState, useTransition, type ChangeEvent } from "react";
import { removeAvatarAction, updateProfileAction, type ProfileFormState } from "@/app/actions/profile";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";

const initialState: ProfileFormState = undefined;

type Props = {
  name: string;
  bio: string;
  skillsValue: string;
  avatarUrl: string | null;
};

export function ProfileForm({ name, bio, skillsValue, avatarUrl }: Props) {
  const [state, action] = useActionState(updateProfileAction, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="avatar" className="label">
          Photo
        </label>
        <div className="mt-2 flex items-center gap-4">
          <Avatar name={name} avatarUrl={preview ?? avatarUrl} size={64} />
          <div className="flex flex-col items-start gap-1.5">
            <input
              id="avatar"
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            />
            {avatarUrl && !preview && (
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => startRemoveTransition(() => removeAvatarAction())}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-500">JPG, PNG, or WebP, up to 2MB.</p>
        {state?.errors?.avatar && <p className="field-error">{state.errors.avatar[0]}</p>}
      </div>

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
