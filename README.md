# DevMatch

A developer collaboration platform: post a project, list your skills, get
matched, form a team, and manage it with a task board and live chat.

Built with Next.js (App Router) + TypeScript + PostgreSQL + Prisma +
Socket.IO.

**See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for the full architecture
write-up** — data model, auth design, the matching algorithm, why there's a
custom server for chat, and everything else worth knowing before touching
this code.

## Quick start

```bash
cp .env.example .env          # then edit SESSION_SECRET to something random
docker compose up -d          # starts Postgres on localhost:5432
npm run db:migrate            # creates tables
npm run db:seed               # demo users, password: password123
npm run dev                   # http://localhost:3000
```

## Scripts

| Command             | What it does                                   |
| -------------------- | ----------------------------------------------- |
| `npm run dev`         | Custom server (Next + Socket.IO), development   |
| `npm run build`       | Production build                                |
| `npm run start`       | Custom server, production                       |
| `npm run lint`        | ESLint                                           |
| `npm run db:migrate`  | Run Prisma migrations                           |
| `npm run db:seed`     | Seed demo data                                  |
| `npm run db:studio`   | Prisma Studio                                   |
