import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Reads searchParams and always needs fresh listings, so skip static
// prerendering (this project doesn't enable Cache Components).
export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: PageProps<"/projects">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const projects = await prisma.project.findMany({
    where: {
      status: "OPEN",
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { skills: { some: { skill: { name: { contains: query, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      owner: { select: { name: true } },
      skills: { select: { skill: { select: { name: true } } } },
    },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Open projects</h1>
        <Link href="/projects/new" className="btn-primary">
          Post a project
        </Link>
      </div>

      <form className="mt-6" action="/projects">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by title, description, or skill..."
          className="input max-w-md"
        />
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.length === 0 && (
          <p className="text-sm text-zinc-500">No open projects match yet.</p>
        )}
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="card hover:border-indigo-400">
            <h2 className="font-medium">{project.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">by {project.owner.name}</p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {project.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((s) => (
                <span key={s.skill.name} className="badge">
                  {s.skill.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
