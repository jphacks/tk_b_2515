#!/bin/bash

PORT=8787

# ポートを使用しているプロセスを検索して強制終了（lsof が無い環境では無視）
if command -v lsof >/dev/null 2>&1; then
	lsof -ti :$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
fi

# Prisma Client を必ず生成（出力先は ../backend/src/generated/prisma）
if command -v pnpm >/dev/null 2>&1; then
	pnpm exec prisma generate --schema=../prisma/schema.prisma || true
else
	npx prisma generate --schema=../prisma/schema.prisma || true
fi

# ルートの.envファイルを読み込んでサーバーを起動
if command -v pnpm >/dev/null 2>&1; then
	pnpm tsx --env-file=../.env src/server.ts
else
	npx tsx --env-file=../.env src/server.ts
fi
