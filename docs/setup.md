## セットアップ

### 必要な環境

- Node.js 20 以上
- pnpm 10.14.0
- Docker & Docker Compose (オプション)

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
# ルートディレクトリで .env ファイルを作成
cp .env.example .env

# .env ファイルを編集して以下を設定:
# - DATABASE_URL (Supabase接続URL)
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - GEMINI_API_KEY (Google AI Studio APIキー)
# - ELEVENLABS_API_KEY (ElevenLabs APIキー)
# - ELEVENLABS_VOICE_ID (使用する音声ID)
# - NEXT_PUBLIC_API_URL (バックエンドのURL、デフォルト: http://localhost:8787)

# Backend用のシンボリックリンクを作成（まだ存在しない場合）
cd backend
ln -s ../.env .env
cd ..
```

> **Note**: このプロジェクトでは、ルートディレクトリの `.env` ファイルを中心に環境変数を管理しています。
> `backend/.env` はルートの `.env` へのシンボリックリンクとして作成することで、環境変数を一元管理できます。

### データベースセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editor で[docs/database-schema.md](docs/database-schema.md)の SQL を実行
3. フロントエンドの`.env`に認証情報を追加

### Cloudflare Workers 本番での DB 接続（重要）

Cloudflare Workers などのサーバレス環境からは、PostgreSQL へ直接 TCP 接続できません。Prisma Accelerate（HTTP over Data Proxy）を使います。

手順:

1. Prisma Accelerate を有効化し、Accelerate 接続文字列（`prisma://...`）を取得
2. Cloudflare ダッシュボードの Workers → Settings → Variables/Secrets に `DATABASE_URL` として `prisma://...` を設定
3. デプロイ

コード側では `DATABASE_URL` が `prisma://` の場合に自動で Accelerate を利用します（`backend/src/lib/prisma.ts`）。

開発環境では `postgresql://...` を使ってローカル DB へ直接接続して構いません。
