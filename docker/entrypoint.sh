#!/bin/sh
set -eu

pnpm install --frozen-lockfile
pnpm build:backend-packages

exec "$@"
