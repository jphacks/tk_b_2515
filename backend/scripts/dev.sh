#!/bin/bash

PORT=8787

# ポートを使用しているプロセスを検索
PID=$(lsof -ti :$PORT 2>/dev/null)

if [ ! -z "$PID" ]; then
  echo "Killing existing process on port $PORT (PID: $PID)"
  kill $PID 2>/dev/null

  # プロセスが完全に停止するまで待機
  sleep 1

  # まだ実行中の場合は強制終了
  if kill -0 $PID 2>/dev/null; then
    echo "Force killing process $PID"
    kill -9 $PID 2>/dev/null
  fi
fi

# サーバーを起動
echo "Starting development server on port $PORT"
tsx src/server.ts
