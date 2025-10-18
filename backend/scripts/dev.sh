#!/bin/bash

PORT=8787

# ポートを使用しているプロセスを検索して強制終了（高速化）
lsof -ti :$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null

# .envファイルを読み込んでサーバーを起動
tsx --env-file=.env src/server.ts
