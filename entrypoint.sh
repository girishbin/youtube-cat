#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

DB_FILE="/data/sqlite.db"

# Check if the database file does not exist
if [ ! -f "$DB_FILE" ]; then
  echo "Database file not found. Running migrations..."
# Apply migrations to create the database schema
# wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && \
  export PNPM_HOME="/root/.local/share/pnpm" && \
  export PATH="$PNPM_HOME:$PATH" && \
  pnpm install drizzle-orm@0.44.7 drizzle-kit@0.31.5 && \
  pnpm exec drizzle-kit migrate
else
  echo "Database file found. Skipping migrations."
fi

# Execute the main container command (from Dockerfile's CMD)
echo "Starting application..."
exec "$@"