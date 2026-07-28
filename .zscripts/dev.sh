#!/bin/bash
cd /home/z/my-project

# Remove stale lockfile that confuses turbopack root detection
rm -f /home/z/package-lock.json 2>/dev/null

echo "[DEV] Installing dependencies..."
bun install --frozen-lockfile 2>&1 || bun install 2>&1

echo "[DEV] Starting Next.js dev server on port 3000..."
exec npx next dev -p 3000
