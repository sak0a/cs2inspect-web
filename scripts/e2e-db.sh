#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${E2E_DB_CONTAINER:-cs2inspect-e2e-db}"
PORT=3306

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "E2E database container '$CONTAINER_NAME' is already running."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Starting existing E2E database container '$CONTAINER_NAME'..."
  docker start "$CONTAINER_NAME" >/dev/null
  exit 0
fi

echo "Creating MariaDB container '$CONTAINER_NAME' on port $PORT..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${PORT}:3306" \
  -e MARIADB_ROOT_PASSWORD=test \
  -e MARIADB_DATABASE=test \
  -e MARIADB_USER=test \
  -e MARIADB_PASSWORD=test \
  mariadb:11

echo "Waiting for database to become ready..."
for _ in $(seq 1 30); do
  if docker exec "$CONTAINER_NAME" healthcheck.sh --connect --innodb_initialized >/dev/null 2>&1; then
    echo "E2E database is ready."
    exit 0
  fi
  sleep 2
done

echo "Database container started but health check did not pass in time." >&2
exit 1
