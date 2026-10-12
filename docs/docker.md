# Run Eclipse with Docker

The Docker image runs the production Next.js server with Node.js 24, pnpm 12.6.0, Git, and Prisma. Compose adds PostgreSQL 17 and preserves database data and agent workspaces in named volumes.

## First start

You need Docker Engine with Docker Compose and permission to access its daemon.

1. Configure your local `.env` using `.env.example` as a reference. Set `NEXT_PUBLIC_API_KEY` to a non-empty value; the browser API client requires it. Configure Resend and `AI_CREDENTIALS_ENCRYPTION_KEY` for email authentication and connected AI providers. Compose supplies `DATABASE_URL` for its PostgreSQL service.
2. Export a database password in your terminal. Use a URL-safe password, such as a randomly generated hexadecimal string:

   ```bash
   export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
   ```

   Keep this password for subsequent starts. Changing it does not change the password in an existing PostgreSQL volume.
3. Build the app and start the database:

   ```bash
   docker compose build app
   docker compose up -d --wait db
   ```

4. Initialize the new local database and start the app:

   ```bash
   docker compose run --rm app pnpm exec prisma db push
   docker compose up -d app
   ```

Open [http://localhost:4040](http://localhost:4040). Set `APP_PORT` in your terminal to use another host port.

`prisma db push` matches the project's existing development setup. The migration history does not include a complete initial schema, so it cannot bootstrap a fresh database with `migrate deploy`. Run schema updates explicitly and review their output; the container does not apply them on startup.

## Configuration

Compose loads runtime settings from `.env`. Environment files are excluded from the Docker build context and are never copied into the image. Only `NEXT_PUBLIC_API_KEY` and `NEXT_PUBLIC_CRYPTO_SECRET_KEY` are passed as build arguments. These values are public browser configuration; rebuild the image when they change. The API key used by the browser and server must match.

The app waits for PostgreSQL's health check. PostgreSQL is accessible within the Compose network, and the app's port is bound to localhost. For remote hosting, configure HTTPS and a reverse proxy; production authentication uses secure cookies.

The runtime runs as the `node` user and includes the dependency tree so Prisma commands and the existing Node.js agent commands remain available. Python and Go are not included; repositories needing those runtimes require an extended image.

## Routine commands

```bash
# View app and database logs.
docker compose logs -f app db

# Rebuild after changing application code or public configuration.
docker compose up -d --build app

# Stop services while retaining database data and agent workspaces.
docker compose down
```

For an external PostgreSQL database, run the image directly instead of the bundled Compose stack. Supply its connection string in your runtime environment:

```bash
docker run --rm --init --env-file .env \
  -p 127.0.0.1:4040:3000 \
  -v eclipse-agent-workspaces:/app/agent-workspaces \
  eclipse-app:local
```

The database host must be reachable from the container; `localhost` refers to the container itself. Prepare the external database separately before starting the app.

The image and health check follow the [Docker Node.js guide](https://docs.docker.com/guides/nodejs/) and [Compose startup order documentation](https://docs.docker.com/compose/how-tos/startup-order/).
