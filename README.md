![logo](./public/logo.svg)

Eclipze is a focused workspace for independent developers who use AI agents across multiple client projects. It brings project context, issues, repository-backed agent work, and client communication together so developers can delegate outcomes without carrying the entire coordination process themselves.

The current project is set up as a **Next.js** app with **pnpm**, using a dark visual system based on the Figma design documented in the [Designer skill](./.agents/skills/designer/SKILL.md).

## Product direction

The product is built around an outcome-first workflow:

1. Give an agent the context for a project and describe the outcome you need.
2. Turn that request into a concise plan with feature-sized, issue-ready tasks.
3. Review the plan, then let the agent work in the selected repository with the chosen approval mode.
4. Keep project issues, agent runs, and client communication visible in one workspace.

The long-term direction includes connecting the tools developers already use to build apps, with products such as v0 and Base44 as candidates. Those integrations are not available in the current app yet.

## Available today

- Projects and client communication
- Issues for tracking features, bugs, and project work
- Repository-backed agent runs with Ask, Plan, User approve, and Auto approve modes
- Reusable agent skills and model selection through connected providers
- A dashboard for project, issue, and agent activity

## Tech stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS v4**
- **pnpm**
- **Tabler Icons**

## Getting started

### Requirements

- Runner: Node.js `>=22x`
- Package manager: `pnpm`

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

Copy `.env.example` to `.env` and set your database connection string:

```bash
cp .env.example .env
```

The default Prisma datasource is configured for PostgreSQL.

### Generate Prisma Client

```bash
pnpm prisma:generate
```

### Start the development server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Available scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:migrate
pnpm prisma:studio
```

## Database

Prisma ORM is configured with:

- schema: `prisma/schema.prisma`
- generated client: `prisma/generated/client`
- shared client: `src/lib/prisma.ts`
- default model: `User`

To apply the current schema to your database during development:

```bash
pnpm prisma:push
```

## Design references

- Figma-derived design rules and Tailwind v4 conventions: [Designer skill](./.agents/skills/designer/SKILL.md)
- Current base color system lives in: [`src/app/globals.css`](./src/app/globals.css)

### Current color tokens

These were extracted from the Figma file and added as the initial theme foundation:

- `--color-background: #010101`
- `--color-background-card: #060606`
- `--color-background-focus: #111111`
- `--color-foreground: #fafafa`
- `--color-foreground-off: #676767`
- `--color-accent: #000bde`

## Security

To report a security vulnerability privately, follow the process in
[SECURITY.md](./SECURITY.md). Do not open public issues for security reports.
