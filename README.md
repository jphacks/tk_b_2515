# 恋愛をしたい男子諸君のためのアプリ恋 AI

![恋AI](./renaipic_kari.png)

[![IMAGE ALT TEXT HERE](https://jphacks.com/wp-content/uploads/2025/05/JPHACKS2025_ogp.jpg)](https://www.youtube.com/watch?v=lA9EluZugD8)

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
cp .env.example .env
# .env ファイルを編集して以下を設定:
# - Supabase URL/Keys
# - Anthropic API Key (Claude)
# - Google AI API Key (Gemini)
# - Google Cloud STT/TTS認証情報
```

### データベースセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editor で[docs/database-schema.md](docs/database-schema.md)の SQL を実行
3. `.env`に認証情報を追加

```bash
# Frontend用
cd frontend
pnpm add @supabase/supabase-js
```

### 開発環境の起動

#### 方法 1: ローカル環境で起動

```bash
# Frontend (Next.js) - ターミナル1
cd frontend
pnpm dev
# http://localhost:3000 でアクセス可能

# Backend (Hono + Cloudflare Workers) - ターミナル2
cd backend
pnpm dev
```

#### 方法 2: Docker で起動

```bash
# Frontend を Docker で起動 (ホットリロード有効)
docker compose --profile dev up frontend-dev

# Backend は別ターミナルでローカル起動
cd backend
pnpm dev
```

### 本番ビルド

#### Frontend (Docker)

```bash
# Dockerイメージのビルドと起動
docker compose up frontend

# または手動ビルド
docker build -t tk_b_2515 .
docker run -p 3000:3000 tk_b_2515
```

#### Backend (Cloudflare Workers)

```bash
cd backend
pnpm deploy
```

## 製品概要

純愛を求める男子学生のためのアプリ、恋 AI(renai)。

### 背景(製品開発のきっかけ、課題等）

弊学は女子率が低く女性経験が少ない男子生徒が多く、それを手助けできるアプリケーションが作りたかった。嘘です。ほんとは単純に彼女が欲しすぎました。

### 製品説明（具体的な製品の説明）

![アーキテクチャー図](./archtecture.png)

### 特長

#### 1. 特長 1

#### 2. 特長 2

#### 3. 特長 3

### 解決出来ること

### 今後の展望

### 注力したこと（こだわり等）

-
-

## 開発技術

### 活用した技術

#### API・データ

-
-

#### フレームワーク・ライブラリ・モジュール

-
-

#### デバイス

-
-

### 独自技術

#### ハッカソンで開発した独自機能・技術

- 独自で開発したものの内容をこちらに記載してください
- 特に力を入れた部分をファイルリンク、または commit_id を記載してください。
