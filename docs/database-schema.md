# データベーススキーマ設計

## 概要
このドキュメントは、恋AIプロジェクトのSupabase (PostgreSQL) データベーススキーマを定義します。

## テーブル定義

### 1. conversations (会話セッション)
会話シミュレーションのセッション情報を保存します。

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned'))
);

-- インデックス
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
```

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | セッションID (主キー) |
| created_at | TIMESTAMP | セッション開始時刻 |
| updated_at | TIMESTAMP | 最終更新時刻 |
| status | TEXT | セッション状態 (active/completed/abandoned) |

---

### 2. messages (会話履歴)
ユーザーとAIのやり取りを保存します。

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT
);

-- インデックス
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | メッセージID (主キー) |
| conversation_id | UUID | 会話セッションID (外部キー) |
| created_at | TIMESTAMP | メッセージ送信時刻 |
| role | TEXT | 発言者 (user/assistant) |
| content | TEXT | メッセージ内容 (STTで変換されたテキスト) |
| audio_url | TEXT | 音声ファイルのURL (オプション) |

---

### 3. feedback (フィードバック)
AIが生成した会話フィードバックを保存します。

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  good_points TEXT NOT NULL,
  improvement_points TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100)
);

-- インデックス
CREATE INDEX idx_feedback_conversation_id ON feedback(conversation_id);
```

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | フィードバックID (主キー) |
| conversation_id | UUID | 会話セッションID (外部キー) |
| created_at | TIMESTAMP | フィードバック生成時刻 |
| good_points | TEXT | 良かった点 (AIが生成) |
| improvement_points | TEXT | 改善点 (AIが生成) |
| overall_score | INTEGER | 総合スコア (0-100) オプション |

---

## Row Level Security (RLS) 設定

MVPでは認証を実装しないため、RLSは無効化します。

```sql
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
```

**注意**: 本番環境では必ずRLSを有効化し、適切なポリシーを設定してください。

---

## セットアップ手順

### 1. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. Database → SQL Editor で上記のSQLを実行

### 2. 環境変数の設定
`.env`ファイルに以下を追加:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Supabaseクライアントライブラリのインストール

```bash
# Frontend
cd frontend
pnpm add @supabase/supabase-js

# Backend (必要に応じて)
cd backend
pnpm add @supabase/supabase-js
```

---

## データフロー例

### 会話セッションの開始
1. フロントエンド: `conversations`テーブルに新規レコード作成
2. セッションID (UUID) を取得

### 会話中
1. ユーザー音声 → STT → テキスト化
2. `messages`テーブルに `role: 'user'` で保存
3. バックエンド: Claude/Geminiで応答生成
4. `messages`テーブルに `role: 'assistant'` で保存
5. TTS → 音声再生

### フィードバック生成
1. 会話終了時、`conversations.status`を`'completed'`に更新
2. バックエンド: 全`messages`を取得してClaudeに渡す
3. フィードバックテキストを生成
4. `feedback`テーブルに保存
5. フロントエンド: フィードバックを表示

---

## 今後の拡張 (フェーズ2以降)

- **users テーブル**: ユーザー認証を導入する場合
- **sessions テーブル**: ログイン状態の管理
- **analytics テーブル**: 非言語コミュニケーションデータ (表情、視線など)
- **scenarios テーブル**: 複数の会話シナリオ管理
