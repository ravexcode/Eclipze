# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global pnpm@12.6.0

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY next.config.mts tsconfig.json postcss.config.mjs ./
COPY src ./src
COPY public ./public
COPY prisma ./prisma

# NEXT_PUBLIC values are embedded in browser bundles during the build.
ARG NEXT_PUBLIC_API_KEY
ARG NEXT_PUBLIC_CRYPTO_SECRET_KEY

ENV NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY}
ENV NEXT_PUBLIC_CRYPTO_SECRET_KEY=${NEXT_PUBLIC_CRYPTO_SECRET_KEY}

# Building and generating Prisma Client do not require a running database.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/eclipse pnpm build
RUN pnpm typecheck

FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV AGENT_WORKSPACE_ROOT=/app/agent-workspaces

# Keep Prisma CLI and the package tools used by repository-backed agents.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/next.config.mts ./

RUN mkdir -p /app/agent-workspaces \
    && chown node:node /app/agent-workspaces

USER node

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "--hostname", "0.0.0.0"]
