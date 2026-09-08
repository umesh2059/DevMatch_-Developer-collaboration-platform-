import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          DevMatch
        </Link>

        {user ? (
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <Link href="/projects" className="hover:text-indigo-600">
              Projects
            </Link>
            <Link href="/matches" className="hover:text-indigo-600">
              Matches
            </Link>
            <Link href="/profile" className="hover:text-indigo-600">
              Profile
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary !px-3 !py-1.5">
                Log out
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="hover:text-indigo-600">
              Log in
            </Link>
            <Link href="/register" className="btn-primary !px-3 !py-1.5">
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
