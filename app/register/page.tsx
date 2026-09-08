"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthFormState = undefined;

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, initialState);

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Already have one?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>

      <form action={action} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input id="name" name="name" className="input" placeholder="Ada Lovelace" required />
          {state?.errors?.name && <p className="field-error">{state.errors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            required
          />
          {state?.errors?.email && <p className="field-error">{state.errors.email[0]}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input id="password" name="password" type="password" className="input" required />
          {state?.errors?.password && (
            <ul className="field-error list-inside list-disc">
              {state.errors.password.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        {state?.message && <p className="field-error">{state.message}</p>}

        <SubmitButton className="btn-primary w-full" pendingLabel="Creating account...">
          Sign up
        </SubmitButton>
      </form>
    </div>
  );
}
