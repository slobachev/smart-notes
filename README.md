# Smart Notes

A notes web app with search, tags, pgvector embeddings, and OpenAI-powered features.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn
- **Backend:** Next.js App Router, NextAuth v5, Zod
- **Data:** PostgreSQL + **pgvector** (Prisma ORM)
- **Infra / services:** Upstash Redis, Sentry, Docker (Postgres)
- **Testing:** [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react)

## Requirements

- [Bun](https://bun.sh) (latest)
- Docker — optional if you already have a compatible `DATABASE_URL`

## Environment

Copy `.env.example` to `.env` and fill in the values.

| Variable                 | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string (with pgvector)   |
| `NEXTAUTH_SECRET`        | NextAuth secret (use a strong random value)    |
| `NEXTAUTH_URL`           | App base URL; locally: `http://localhost:3000` |
| `OPENAI_API_KEY`         | OpenAI API key                                 |
| `KV_*`, `REDIS_URL`      | Upstash Redis (see `.env.example`)             |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional; client error reporting)  |

With the included `docker-compose` defaults:

`DATABASE_URL="postgresql://postgres:postgres@localhost:9999/fs_learn"`

## Local setup

```bash
# 1. Postgres with pgvector (host port 9999 → 5432 in the container)
docker compose up -d

# 2. Dependencies and Prisma
cp .env.example .env
# edit .env (at minimum DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY; add Redis/Sentry as needed)

bun install
bunx prisma migrate deploy   # or prisma migrate dev when evolving the schema
bun run dev
```

App: **http://localhost:3000**

Production: `bun run build` → `bun run start`.

## Testing

Tests are colocated as `*.test.ts` / `*.test.tsx`. Run:

```bash
bun run test       # watch mode
bun run test:run   # single pass (CI)
```

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `bun run dev`      | Development server                   |
| `bun run build`    | `prisma generate` + production build |
| `bun run start`    | Run after build                      |
| `bun run lint`     | ESLint                               |
| `bun run test`     | Vitest (watch)                       |
| `bun run test:run` | Vitest once                          |

---

![Screenshot](https://github.com/user-attachments/assets/174ee6be-eba5-4783-8a32-93830c4ce481)
