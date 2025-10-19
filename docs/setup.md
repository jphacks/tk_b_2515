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
