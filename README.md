![logo](./public/images/app_image.png)

Eclipse is a **developer ↔ client contact tool** designed to centralize communication, project context, and workflow visibility in one interface.

The current project is set up as a **Next.js** app with **pnpm**, using a dark visual system based on the Figma design documented in [`DESIGN.md`](./DESIGN.md).

## Purpose

This app is intended to help developers and clients stay aligned by giving them a shared place to:

- review project status
- track issues and ongoing work
- keep communication organized
- monitor agent/development sessions
- build a clearer handoff between technical and non-technical stakeholders

## Tech stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS v4**
- **pnpm**
- **Tabler Icons**

## Getting started

### Requirements

- Node.js `>=20`
- `pnpm`

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

- Figma-derived notes and base UI tokens: [`DESIGN.md`](./DESIGN.md)
- Current base color system lives in: [`src/app/globals.css`](./src/app/globals.css)

### Current color tokens

These were extracted from the Figma file and added as the initial theme foundation:

- `--color-background: #010101`
- `--color-background-card: #060606`
- `--color-background-focus: #111111`
- `--color-foreground: #fafafa`
- `--color-foreground-off: #676767`
- `--color-accent: #000bde`

## Project structure

```text
src/
  app/
    dashboard/
    globals.css
    layout.tsx
    page.tsx
  components/
    layouts/
    sidebar.tsx
```

## Status

This repository currently contains the **basic app foundation**:

- Next.js migration completed
- pnpm setup completed
- Bun removed
- initial dashboard shell kept minimal
- Figma-based color tokens added

## Security

To report a security vulnerability privately, follow the process in
[SECURITY.md](./SECURITY.md). Do not open public issues for security reports.
