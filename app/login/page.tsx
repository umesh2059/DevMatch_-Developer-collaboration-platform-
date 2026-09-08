"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthFormState = undefined;

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        New here?{" "}
        <Link href="/register" className="text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>

      <form action={action} className="mt-8 space-y-4">
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
          {state?.errors?.password && <p className="field-error">{state.errors.password[0]}</p>}
        </div>

        {state?.message && <p className="field-error">{state.message}</p>}

        <SubmitButton className="btn-primary w-full" pendingLabel="Logging in...">
          Log in
        </SubmitButton>
      </form>

      <p className="mt-6 text-xs text-zinc-500">
        Demo accounts (after seeding): asha@example.com / marco@example.com /
        priya@example.com — password: password123
      </p>
    </div>
  );
}
