# GitHub Actions Workflows

このディレクトリには、プロジェクトのCI/CDワークフローが含まれています。

## ワークフロー一覧

### 🔄 CI (Continuous Integration) - `ci.yml`

**トリガー:**
- `push` イベント（main, develop, feature/* ブランチ）
- `pull_request` イベント（main, develop ブランチへのPR）

**実行内容:**

#### Frontend Job
- ESLint によるコードチェック
- TypeScript型チェック (`tsc --noEmit`)
- Jest テスト実行（カバレッジ付き）
- Next.js ビルド検証
- Codecov へのカバレッジアップロード

#### Backend Job
- TypeScript型チェック
- Prisma クライアント生成
- テスト実行（設定されている場合）

#### Prisma Job
- Prisma スキーマの検証
- Prisma フォーマットチェック

**並列実行:** すべてのジョブが並列で実行されます

---

### 🚀 Deploy - `deploy.yml`

**トリガー:**
- `push` イベント（main ブランチ）
- 手動トリガー (`workflow_dispatch`)

**実行内容:**

#### Test Job（デプロイ前）
1. フロントエンドの依存関係をインストール
2. テストを実行
3. ビルドを検証

#### Deploy Backend Job（テスト成功後）
1. 依存関係をインストール
2. Prisma クライアント生成
3. TypeScript型チェック
4. Cloudflare Workers へデプロイ

**依存関係:** `deploy-backend` ジョブは `test` ジョブの成功が必要

---

## 必要なシークレット

以下のシークレットをGitHubリポジトリに設定してください：

### Cloudflare（デプロイ用）
- `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウントID

### 環境変数（オプション）
- `NEXT_PUBLIC_API_URL`: フロントエンドのAPI URL（デフォルト: `http://localhost:8787`）

---

## ローカルでのテスト

### フロントエンド
```bash
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

### バックエンド
```bash
cd backend
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm exec tsc --noEmit
```

### Prisma
```bash
pnpm exec prisma validate --schema=./prisma/schema.prisma
pnpm exec prisma format --check --schema=./prisma/schema.prisma
```

---

## トラブルシューティング

### ビルドエラー
- ローカルで `pnpm build` を実行して問題を再現
- `NODE_OPTIONS="--max-old-space-size=4096"` でメモリ制限を増やす

### テストエラー
- `pnpm test -- --verbose` で詳細なログを確認
- `pnpm test -- --coverage` でカバレッジレポートを生成

### デプロイエラー
- Cloudflare API トークンとアカウントIDを確認
- `wrangler` CLI でローカルテスト: `pnpm wrangler dev`

---

## ワークフローの改善案

今後追加を検討する機能：

- [ ] E2Eテスト（Playwright/Cypress）
- [ ] セキュリティスキャン（Snyk/Dependabot）
- [ ] パフォーマンステスト（Lighthouse CI）
- [ ] フロントエンドのデプロイ（Vercel/Netlify）
- [ ] ステージング環境へのデプロイ
- [ ] Slack/Discord通知
- [ ] 自動リリースノート生成
