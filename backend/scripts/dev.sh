#!/bin/bash

PORT=8787

# ポートを使用しているプロセスを検索して強制終了（lsof が無い環境では無視）
if command -v lsof >/dev/null 2>&1; then
	lsof -ti :$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
fi

# Prisma Clientが既に生成済みかチェック
PRISMA_CLIENT_PATH="../frontend/src/generated/prisma/index.js"
if [ ! -f "$PRISMA_CLIENT_PATH" ]; then
	echo "Generating Prisma Client..."
	if command -v pnpm >/dev/null 2>&1; then
		pnpm exec prisma generate --schema=../prisma/schema.prisma
	else
		npx prisma generate --schema=../prisma/schema.prisma
	fi
else
	echo "Prisma Client already exists, skipping generation"
fi

# ルートの.envファイルを読み込んでサーバーを起動
# Node.jsのメモリ制限を1GBに設定、WASMモジュールを有効化（Prisma 7対応）
export NODE_OPTIONS="--max-old-space-size=1024 --experimental-wasm-modules"

if command -v pnpm >/dev/null 2>&1; then
	pnpm tsx --env-file=../.env src/server.ts
else
	npx tsx --env-file=../.env src/server.ts
fi
