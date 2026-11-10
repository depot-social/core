# Docker development

This environment runs the complete project locally: Strapi and Nuxt share one Node container, alongside MySQL and Mailpit. You only need Docker Engine or Docker Desktop with Docker Compose; Node and pnpm are installed inside the image.

## Start development

Run from the repository root:

```bash
docker compose up --build
```

The first start downloads dependencies and builds the shared package and local plugins. Nuxt starts after Strapi responds to its health endpoint. No host-side `pnpm install` or `.env` is required.

| Service | Address |
| --- | --- |
| Nuxt | http://127.0.0.1:3000 |
| Strapi admin | http://127.0.0.1:1337/admin |
| Strapi API | http://127.0.0.1:1337/api |
| Mailpit inbox | http://127.0.0.1:8025 |
| MySQL from the host | `127.0.0.1:3307` |
| SMTP from the host | `127.0.0.1:1025` |

For first-time application setup, follow [Installation and Strapi setup](INSTALL.md). A running server does not create an administrator, project permissions or website content automatically.

## Configuration

`.env.docker` contains shared, local-only defaults. Compose injects these values and mounts this file read-only as `/workspace/.env.docker`. `DEPOT_ENV_FILE=../../.env.docker` selects it in the Strapi and Nuxt scripts, instead of their default `../../.env`. Your host `.env` is not modified or used by the application container, and no placeholder `.env` is created on the host.

Internal connections use `mysql:3306` and `mailpit:1025`. Strapi and Nuxt share the app container, so `http://127.0.0.1:1337` works both for server-side frontend requests and in your browser. `NUXT_PORT=3000` takes precedence over Strapi's `PORT=1337`.

Edit `.env.docker` to select layers, toggle plugins or supply an optional Mapbox token. Recreate the app container after changing environment values:

```bash
docker compose up -d --force-recreate app
```

Use `http://127.0.0.1:3000` in the browser; the conversations plugin currently expects this exact origin. MySQL uses database `depot_berlin_strapi_ausleihe` and credentials `root` / `root`, matching the original local database service. Mailpit accepts SMTP without authentication and captures messages locally.

## Everyday commands

```bash
# Run in the background and follow application logs
docker compose up -d --build
docker compose logs -f app

# Open a shell (does not repeat installation/builds)
docker compose exec app sh

# Run unit tests
docker compose exec app pnpm exec vitest run --threads false

# Add a dependency using the container's Node and pnpm
docker compose exec app pnpm --filter @depot/nuxt add package-name

# Rebuild shared/plugin code and restart both development servers
docker compose restart app

# Stop containers; keep their data
docker compose down
```

Nuxt and Strapi watch their application source files. Shared code and local plugin TypeScript are compiled during app startup; restart the app after editing them. Every startup runs `pnpm install --frozen-lockfile` and rebuilds all backend workspace packages. Installation reuses the persistent pnpm store and dependency volumes.

`exec` runs a command in the existing app container. `run --rm app ...` creates a one-off app container and runs installation/builds before its command. Dependency additions update the bind-mounted manifests and lockfile on the host.

## Run the installation commands inside Docker

The Docker environment already supplies the environment values, so skip `setup:env` when using it. To perform the setup import described in [INSTALL.md](INSTALL.md), stop the regular app process and use a one-off container:

```bash
docker compose stop app
docker compose run --rm app pnpm setup:strapi
docker compose up -d app
```

For other offline Strapi commands from the installation guide, use the same stop/run/start pattern. For example, to deliberately replace the project Content Manager views:

```bash
docker compose stop app
docker compose run --rm app pnpm --filter @depot/strapi configuration:restore --strategy replace
docker compose up -d app
```

## Files and persistence

The repository is mounted at `/workspace`. Source changes, uploaded files under `packages/strapi/public/uploads`, and compiled workspace output remain on the host. Dependencies for the root and every workspace package are mounted in separate Docker volumes, so native Linux binaries do not replace host dependencies. Nuxt's `.nuxt` cache is isolated too.

MySQL data and Mailpit messages use named volumes. `docker compose down` and subsequent `up` retain these, including database users, content and captured messages. Changing `MYSQL_DATABASE` or the root password only initializes a new database volume; it does not rewrite an existing database.

To deliberately reset **all Docker data for this Compose project**, including MySQL and Mailpit, use:

```bash
docker compose down --volumes
docker compose up --build
```

This does not remove bind-mounted uploads or generated files. Preserve any data you need before resetting volumes.

## Linux user IDs

The image uses the `node` user with UID/GID `1000`, so generated host files remain editable. If your account uses different IDs, build with matching arguments:

```bash
LOCAL_UID=$(id -u) LOCAL_GID=$(id -g) docker compose up --build
```

Dependency/cache volumes retain their original ownership. Use the same IDs on subsequent builds; recreating a container alone does not change existing volume ownership.

## Troubleshooting

- **App exited during startup:** inspect `docker compose logs app`. Frozen-lockfile errors mean manifests and lockfile must be updated together; use pnpm inside the container for dependency changes.
- **Port already allocated:** stop host development processes or other containers using ports `1337`, `3000`, `3307`, `8025` or `1025`. Nuxt and Strapi must retain their documented public URLs if you change mappings.
- **Website reports missing content or access denied:** complete [INSTALL.md](INSTALL.md). On a fresh database the homepage and search-page records and project permissions do not yet exist.
- **Plugin changes are not visible:** restart `app` to rebuild local plugins and shared output.
- **No file events on Docker Desktop:** use polling (`CHOKIDAR_USEPOLLING=true` for Nuxt and Strapi's `develop --polling` option) if your host filesystem does not propagate events. Native Linux bind mounts normally deliver events directly.
- **Permission denied on a Linux bind mount:** check host UID/GID and directory ownership. On SELinux-enforcing hosts the source and environment bind mounts may additionally require the appropriate `:z`/`:Z` label options.
- **Mail missing:** inspect the Strapi logs, `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, and the sender/template settings described in [INSTALL.md](INSTALL.md).

The image and Compose defaults are for local development. They do not define a production deployment.
