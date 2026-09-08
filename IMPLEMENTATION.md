# DevMatch — Implementation Notes

This is the one file to read to understand what was built, why it's built the
way it is, and how to run it. Written for future-you (or anyone else picking
this up), not as a marketing pitch.

## What this is

DevMatch is a full-stack app that connects developers to projects by skill
match. A user lists their skills; a project lists the skills it needs;
DevMatch ranks the fit. From there: request to join → owner accepts/declines
→ a team workspace is created with a task board and live chat.

Stack: **Next.js 16 (App Router) + TypeScript + PostgreSQL + Prisma 7 +
Socket.IO**, no separate Express backend — Next's Route Handlers and Server
Actions serve as the API layer, with one small custom Node server added
specifically to host the WebSocket connection for chat.

## Important environment note

This repo's `node_modules/next` is version **16.3.4**, materially different
from the Next.js most training data describes (App Router with Cache
Components / Partial Prerendering, `proxy.ts` replacing `middleware.ts`,
async `params`/`searchParams`, Server Actions as the primary mutation path).
Prisma here is **v7**, which also broke from what most people know: the
database URL no longer lives in `schema.prisma` — see "Prisma 7" below.
Both of these were discovered by reading `node_modules/next/dist/docs/` and
hitting real CLI errors, not assumed from memory. If you upgrade either
package, some of what's described here may need re-checking against
`node_modules/<pkg>/dist/docs` again.

## Architecture at a glance

```
app/
  page.tsx                    Landing page
  login/, register/           Auth forms (client components, useActionState)
  dashboard/                  Overview: your projects, teams, sent requests
  profile/                    Edit name/bio/skills
  projects/                   Browse + search open projects
  projects/new/                 Create a project
  projects/[id]/                 Detail: join request, owner accept/decline,
                                  suggested candidates
  matches/                    Ranked project matches for the current user
  teams/[id]/                 Team workspace: task board + chat
  actions/                    Server Actions (auth, profile, projects, tasks)

components/
  nav.tsx, submit-button.tsx  Shared UI
  teams/task-board.tsx        Kanban-style task board (client)
  teams/chat.tsx               Socket.IO chat panel (client)

lib/
  prisma.ts                   PrismaClient singleton (Prisma 7 driver adapter)
  session-crypto.ts           Pure JWT sign/verify (no next/headers import)
  session.ts                  Cookie-based session helpers (uses next/headers)
  dal.ts                      Data Access Layer: verifySession, getCurrentUser
  matching.ts                 Skill-matching algorithm
  teams.ts                    Team-membership guard
  validation.ts               Zod schemas + skill-string parsing

prisma/
  schema.prisma                Data model
  seed.ts                      Demo users/projects

proxy.ts                      Route protection (Next 16's renamed middleware)
server.ts                     Custom server: Next request handler + Socket.IO
prisma.config.ts              Prisma 7 CLI config (schema path + DB URL)
docker-compose.yml            Local Postgres for development
```

## Data model (`prisma/schema.prisma`)

- **User** — has many **UserSkill** (skill + proficiency 1-5)
- **Project** — owned by a User, has required **ProjectSkill**s, a status
  (`OPEN` → `IN_PROGRESS` once a team forms → `COMPLETED`/`ARCHIVED`)
- **CollaborationRequest** — a user asking to join a project; `PENDING` →
  `ACCEPTED`/`DECLINED`. Unique per (project, requester).
- **Team** — created 1:1 with a Project the moment its first request is
  accepted. Has **TeamMember**s (`OWNER`/`MEMBER`), **Task**s, **Message**s.
- **Task** — belongs to a Team, has a status (`TODO`/`IN_PROGRESS`/`DONE`)
  and an optional assignee (must be a team member).
- **Message** — belongs to a Team, written by a member; persisted by the
  Socket.IO server on every chat send.

## Auth

Follows the Next.js 16 "How to implement authentication" guide almost
verbatim: `bcryptjs` for password hashing, `jose` for a stateless
HttpOnly-cookie JWT session (`SESSION_SECRET`, 7-day expiry), and a **Data
Access Layer** (`lib/dal.ts`) with `verifySession()`/`getCurrentUser()`
memoized per-request via React's `cache()`.

`proxy.ts` (root-level; Next 16 renamed `middleware.ts` → `proxy.ts`, same
mechanism) does an **optimistic** cookie check to redirect unauthenticated
users away from protected routes (`/dashboard`, `/profile`, `/projects/new`,
`/matches`, `/teams/*`) and authenticated users away from `/login`/`/register`.
Every Server Action and data-fetching page also calls `verifySession()` /
`requireCurrentUser()` itself — proxy is a UX shortcut, not the security
boundary, per the docs' explicit guidance.

**Why two session files:** `lib/session-crypto.ts` holds the pure JWT
encrypt/decrypt logic with no framework dependency. `lib/session.ts` wraps it
with `cookies()` from `next/headers` for use inside Server
Components/Actions. They're split because `server.ts` (the custom Socket.IO
server, see below) runs under plain Node, not through Next's compiler —
importing `next/headers` there throws (`AsyncLocalStorage accessed in
runtime where it is not available`), and importing the `server-only` guard
package outside Next's compiler throws unconditionally too. `server.ts` and
`proxy.ts` both import only from the dependency-free `session-crypto.ts`.

## Skill matching (`lib/matching.ts`)

`scoreSkillMatch(candidateSkills, requiredSkillIds)` → 0-100:

- **70%** weight on *coverage*: what fraction of a project's required skills
  the candidate has at all.
- **30%** weight on *depth*: the candidate's average proficiency (1-5,
  normalized) across just the skills they share with the project.
- Zero overlap always scores 0, regardless of how many other skills the
  candidate has — relevance to *this* project is what's ranked, not raw
  skill count.

Two call sites: `getProjectMatchesForUser` (developer → ranked open
projects, for `/matches`) and `getCandidatesForProject` (project owner →
ranked candidates, shown on the project detail page). Both exclude
already-related people (existing members, existing requesters, the owner).

This is intentionally a simple, explainable formula rather than anything
ML-based — good enough to demonstrate real matching behavior, easy to reason
about, easy to extend later (e.g. weighting by recency, or adding a
project-owner "importance" per skill rather than treating all required
skills as equally weighted).

## Collaboration → Team lifecycle

1. Owner posts a project (`createProjectAction`) with required skills.
2. Another user sends a `CollaborationRequest` (`requestToJoinAction`) —
   blocked if they're the owner, the project isn't `OPEN`, or they've already
   requested.
3. Owner accepts or declines (`respondToRequestAction`). On the **first**
   acceptance for a project: a `Team` is created, the owner is added as
   `OWNER`, the project flips to `IN_PROGRESS`. Every subsequent acceptance
   just adds the requester as a `MEMBER` of the existing team.
4. Team members get a workspace at `/teams/[id]` with a task board and chat.

## Real-time chat — why a custom server

Next's Route Handlers (`app/api/**/route.ts`) run in a serverless-style
request/response model; they can't hold a persistent WebSocket connection
for a chat feature. The documented, supported way around this (see
`node_modules/next/dist/docs/01-app/02-guides/custom-server.md`) is a custom
`server.ts` that wraps `next()`'s request handler in a plain `http.Server`,
onto which any other Node library — here, `socket.io` — can attach.

`server.ts`:
- Boots Next (`next({ dev })`, `app.prepare()`), then a Socket.IO server on
  the same HTTP server, path `/socket.io`.
- On connection, reads the session cookie straight from the raw handshake
  headers (hand-rolled cookie parsing — no need for a cookie library for one
  cookie) and decrypts it with `decryptSession` from `session-crypto.ts`.
  Unauthenticated sockets are disconnected immediately.
- `team:join` — verifies the socket's user is a member of that team
  (`requireTeamMembership`), then joins the Socket.IO room `team:<id>`.
- `chat:send` — re-verifies membership, persists the message via Prisma,
  then broadcasts `chat:message` to everyone in that room.

Because of this, **`npm run dev` and `npm run start` no longer run
`next dev`/`next start` directly** — they run `server.ts` (via `tsx`), which
boots Next internally. `npm run build` is unchanged (`next build`).

The client side (`components/teams/chat.tsx`) connects with
`socket.io-client`, joins its team's room on connect, and appends incoming
messages to a local list. Initial history (last 100 messages) is fetched
server-side in `app/teams/[id]/page.tsx` and passed in as props, so the chat
panel isn't empty on first load.

## Prisma 7: what changed from "classic" Prisma

`schema.prisma`'s `datasource` block **no longer accepts a `url` field** —
`prisma generate`/`migrate` now error with `P1012` if you try. Instead:

- **`prisma.config.ts`** (repo root) supplies the connection string to the
  Prisma **CLI** (`generate`, `migrate`, `studio`) via `datasource.url`,
  using `env("DATABASE_URL")`.
- **The Prisma CLI's config loader does not auto-load `.env`** the way
  older versions did — `prisma.config.ts` calls `process.loadEnvFile(".env")`
  itself before `defineConfig()` runs, or `env()` throws
  `Cannot resolve environment variable`.
- **`PrismaClient` at runtime** no longer reads a schema-embedded URL at
  all — it's constructed with a **driver adapter**
  (`lib/prisma.ts` → `new PrismaPg(process.env.DATABASE_URL)` from
  `@prisma/adapter-pg`, which wraps `pg`). This is why `pg` and
  `@prisma/adapter-pg` are dependencies even though app code never imports
  `pg` directly.

Both `prisma.config.ts` and `lib/prisma.ts` need `DATABASE_URL`
independently — one for the CLI, one for the running app.

## Rendering model: Cache Components was left off

Next 16 ships an opt-in `cacheComponents: true` config (Partial
Prerendering by default once enabled) that requires structuring every route
around `<Suspense>` boundaries and explicit `"use cache"` directives to get a
static shell. Almost every page in this app is inherently per-user dynamic
data (dashboard, matches, project detail with request state, team
workspace) — there's very little here that benefits from a static shell, and
adopting Cache Components correctly would add real structural complexity for
close to zero payoff at this app's current size. **Decision: left disabled**
(the default). Every data-driven page instead has an explicit
`export const dynamic = "force-dynamic"` so nothing is silently
build-time-prerendered against a database that may not be reachable at build
time. If this app grows genuinely static, cacheable, high-traffic pages
later (e.g. a public project directory), Cache Components is worth
revisiting for those specific routes.

## Styling

Tailwind v4 (CSS-first config, no `tailwind.config.ts` — see
`app/globals.css`'s `@theme inline` block, which predates this session).
A handful of reusable classes (`.btn-primary`, `.card`, `.input`, `.badge`,
etc.) live in `@layer components` in `globals.css`. One gotcha hit and fixed:
Tailwind v4's `@apply` only accepts real utility classes, not other
`@layer components` classes — the original design had `.btn-primary` do
`@apply btn bg-indigo-600 ...` referencing a shared `.btn` base, which built
successfully in dev but failed the production build
(`Cannot apply unknown utility class 'btn'`). Fixed by having each button
variant spell out the full utility list directly instead of chaining.

## What's deliberately not built

Scoped out to keep this a coherent, working MVP rather than a half-finished
sprawl:

- Email verification, password reset, OAuth/social login
- Notifications (in-app or email) for new requests/messages
- File/image uploads (avatars, project images)
- Pagination on `/projects` and `/matches` (currently capped at 50/20 results)
- Rate limiting on auth endpoints
- Automated tests
- Message edit/delete, typing indicators, read receipts in chat
- Removing a team member, transferring project ownership

## Running it locally

```bash
cp .env.example .env          # then edit SESSION_SECRET to something random
docker compose up -d          # starts Postgres on localhost:5434
npm run db:migrate            # creates tables (prompts for a migration name)
npm run db:seed               # demo users: asha/marco/priya @example.com, password123
npm run dev                   # boots the custom server (Next + Socket.IO) on :3000
```

Other scripts: `npm run db:studio` (Prisma Studio), `npm run build` /
`npm run start` (production), `npm run lint`.

### Port note: why 5434, not the default 5432

`docker-compose.yml` publishes Postgres on host port **5434**, not the
default 5432. On the machine this was built on, a native (non-Docker)
PostgreSQL install already had `0.0.0.0:5432` bound, alongside Docker
Desktop's own proxy listening on `[::]:5432` — same port, different address
families, both technically "listening." IPv4 connections to
`localhost:5432` (which is what Prisma/`pg` use) silently reached the
*native* Postgres instead of the container, and failed with
`P1000: Authentication failed`, which looked exactly like a bad password
even though the container's credentials were correct. Diagnosed by checking
`Get-NetTCPConnection -LocalPort 5432` and finding two owning processes. If
you hit the same error on a fresh machine, check for a similar collision
before assuming the credentials are wrong.

## Verification performed this session

- `npx tsc --noEmit`, `npx eslint .`, `npx next build` — all clean; every
  route correctly reports as dynamic (`ƒ`), proxy is picked up
- `npm run dev` (custom server) smoke-tested: `/`, `/login`, `/register`
  return 200; unauthenticated `/dashboard` correctly redirects (307) to
  `/login?next=%2Fdashboard`
- **With a live Postgres database** (migrated + seeded): `/projects` and
  `/projects/[id]` render real rows from the database end-to-end through
  the Prisma 7 driver adapter; the matching formula was run directly
  against seeded data (Marco's skills vs. the seed project's required
  skills → 77% — coverage 2/3 skills matched × 70 + avg depth 1.0 × 30,
  matching the algorithm's documented weights by hand); password hashing
  round-trips correctly (`bcrypt.compare` true for the right password,
  false for a wrong one)
- **Not verified**: the actual browser flows — submitting the login/register
  forms, accepting a collaboration request, and the live chat roundtrip —
  since React Server Actions encode a dynamic action reference into the
  form that isn't practical to replay by hand with curl. The dev server is
  left running at `http://localhost:3000`; log in as `asha@example.com`
  (or `marco@example.com` / `priya@example.com`), password `password123`,
  and click through: `/matches` (Marco or Priya should see the seeded
  project ranked), request to join as one account, accept as Asha in
  another browser/incognito session, then open `/teams/[id]` in both and
  confirm a chat message sent from one appears in the other.
