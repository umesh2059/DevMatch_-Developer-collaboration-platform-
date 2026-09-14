import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/avatar";
import { prisma } from "@/lib/prisma";

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-medium text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export async function Nav() {
  const user = await getCurrentUser();

  const pendingRequestCount = user
    ? await prisma.collaborationRequest.count({
        where: { status: "PENDING", project: { ownerId: user.id } },
      })
    : 0;

  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard", badge: pendingRequestCount },
        { href: "/projects", label: "Projects", badge: 0 },
        { href: "/matches", label: "Matches", badge: 0 },
        { href: "/profile", label: "Profile", badge: 0 },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", badge: 0 }] : []),
      ]
    : [{ href: "/login", label: "Log in", badge: 0 }];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          DevMatch
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm sm:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center hover:text-indigo-600">
              {link.label}
              <NotificationBadge count={link.badge} />
            </Link>
          ))}
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/profile" aria-label="Your profile">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size={28} />
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="btn-secondary !px-3 !py-1.5">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link href="/register" className="btn-primary !px-3 !py-1.5">
              Sign up
            </Link>
          )}
        </nav>

        {/* Mobile nav: no JS needed, works with the details/summary disclosure */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <details className="group relative">
            <summary className="btn-secondary !px-3 !py-1.5 list-none cursor-pointer select-none">
              Menu
            </summary>
            <nav className="absolute right-0 z-10 mt-2 flex w-44 flex-col gap-1 rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {link.label}
                  <NotificationBadge count={link.badge} />
                </Link>
              ))}
              {user ? (
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Log out
                  </button>
                </form>
              ) : (
                <Link
                  href="/register"
                  className="rounded px-2 py-1.5 font-medium text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Sign up
                </Link>
              )}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
