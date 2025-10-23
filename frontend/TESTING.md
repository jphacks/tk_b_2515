# テスト手順書

## 概要

このドキュメントでは、恋AIフロントエンドのテスト環境のセットアップと実行方法について説明します。

## テストの種類

### 1. 単体テスト (Unit Test)

**概要**: 個々の関数やコンポーネントを独立してテストします。

**目的**:
- 最小単位のコードが正しく動作することを確認
- バグの早期発見
- リファクタリング時の安全性確保

**対象**:
- 個別の関数
- 単一のReactコンポーネント
- ユーティリティ関数
- カスタムフック

**ツール**: Jest + React Testing Library

**実行速度**: ⚡⚡⚡ 最速（数秒）

**例**:
```tsx
// src/utils/formatDate.test.ts
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2025-01-15");
    expect(formatDate(date)).toBe("2025年1月15日");
  });
});
```

```tsx
// src/components/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", async () => {
    const handleClick = jest.fn();
    const { user } = render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

### 2. 結合テスト (Integration Test)

**概要**: 複数のコンポーネントやモジュールが連携して正しく動作することをテストします。

**目的**:
- コンポーネント間の相互作用を検証
- データフローの確認
- APIとの統合確認

**対象**:
- 親子関係のあるコンポーネント群
- ページ全体
- APIクライアント + コンポーネント
- 状態管理 + UI

**ツール**: Jest + React Testing Library + MSW (API モック)

**実行速度**: ⚡⚡ 中速（数十秒）

**例**:
```tsx
// src/app/simulation/page.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import SimulationPage from "./page";

// APIモックサーバーのセットアップ
const server = setupServer(
  rest.post("/api/chat", (req, res, ctx) => {
    return res(ctx.json({ message: "こんにちは！" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("SimulationPage (Integration)", () => {
  it("sends message and displays response", async () => {
    const { user } = render(<SimulationPage />);

    // メッセージ入力
    const input = screen.getByRole("textbox");
    await user.type(input, "テストメッセージ");

    // 送信ボタンクリック
    const sendButton = screen.getByRole("button", { name: "送信" });
    await user.click(sendButton);

    // APIレスポンスが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("こんにちは！")).toBeInTheDocument();
    });
  });
});
```

---

### 3. E2Eテスト (End-to-End Test)

**概要**: 実際のブラウザでユーザーの操作フローを再現し、アプリケーション全体をテストします。

**目的**:
- ユーザーシナリオの検証
- 本番環境に近い条件でのテスト
- クリティカルパスの動作確認

**対象**:
- ユーザージャーニー全体
- 複数ページにまたがる操作
- 実際のブラウザでの動作

**ツール**: Playwright または Cypress

**実行速度**: ⚡ 低速（数分）

**セットアップ方法** (Playwright):

```bash
pnpm add -D @playwright/test
npx playwright install
```

**例**:
```typescript
// e2e/conversation-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("会話フロー", () => {
  test("ユーザーが会話を開始し、フィードバックを受け取る", async ({ page }) => {
    // 1. トップページにアクセス
    await page.goto("http://localhost:3000");

    // 2. 「今すぐはなしかける」ボタンをクリック
    await page.click('text=今すぐはなしかける');

    // 3. シミュレーションページに遷移
    await expect(page).toHaveURL(/.*simulation/);

    // 4. マイクボタンをクリックして会話開始
    await page.click('[aria-label="マイク"]');

    // 5. 音声入力をシミュレート（実際にはモック）
    await page.evaluate(() => {
      // テスト用の音声入力シミュレーション
    });

    // 6. AIの応答が表示されることを確認
    await expect(page.locator('text=まき')).toBeVisible();

    // 7. 会話終了ボタンをクリック
    await page.click('text=会話を終了');

    // 8. フィードバックページに遷移
    await expect(page).toHaveURL(/.*feedback/);

    // 9. フィードバックが表示されることを確認
    await expect(page.locator('text=良かった点')).toBeVisible();
    await expect(page.locator('text=改善点')).toBeVisible();
  });
});
```

---

## テスト戦略：テストピラミッド

```
       /\
      /  \     E2Eテスト (少数)
     /____\    - 最も遅い
    /      \   - 最も高コスト
   / 結合    \  - クリティカルパスのみ
  /  テスト  \
 /__________\
/            \ 単体テスト (多数)
/  単体テスト  \ - 最も速い
/______________\ - 最も低コスト
                 - 全機能をカバー
```

**推奨バランス**:
- 単体テスト: 70%
- 結合テスト: 20%
- E2Eテスト: 10%

---

## テストタイプ比較表

| 項目 | 単体テスト | 結合テスト | E2Eテスト |
|------|-----------|-----------|----------|
| **範囲** | 単一関数/コンポーネント | 複数コンポーネント | アプリケーション全体 |
| **実行速度** | ⚡⚡⚡ 最速 | ⚡⚡ 中速 | ⚡ 低速 |
| **実装コスト** | 低 | 中 | 高 |
| **メンテナンスコスト** | 低 | 中 | 高 |
| **信頼性** | 中 | 高 | 最高 |
| **デバッグの容易さ** | 容易 | やや難しい | 難しい |
| **実行環境** | Node.js (jsdom) | Node.js (jsdom) | 実ブラウザ |
| **依存関係** | モック化 | 部分的にモック化 | 実際の環境 |
| **失敗時の原因特定** | 容易 | やや難しい | 難しい |

---

## どのテストを書くべきか？

### 単体テストを書くべき場合

✅ **書くべき**:
- ビジネスロジックを含む関数
- ユーティリティ関数（日付フォーマット、バリデーションなど）
- カスタムフック
- 複雑な条件分岐がある関数
- 計算処理

❌ **不要**:
- 見た目だけのコンポーネント（スタイリングのみ）
- サードパーティライブラリのテスト
- 定数の定義

### 結合テストを書くべき場合

✅ **書くべき**:
- フォーム全体の動作
- ページ単位の機能
- APIとの通信を含む処理
- 複数コンポーネントの連携

❌ **不要**:
- 単純な親子関係のみのコンポーネント（単体テストで十分）

### E2Eテストを書くべき場合

✅ **書くべき**:
- ユーザー登録フロー
- 購入フロー
- 重要なビジネスシナリオ
- クリティカルパス

❌ **不要**:
- すべての機能（コストが高すぎる）
- 頻繁に変更される画面

---

## 実践例：恋AIでのテスト戦略

### 単体テスト例

```tsx
// src/utils/validateInput.test.ts
describe("validateInput", () => {
  it("空文字列はエラーを返す", () => {
    expect(validateInput("")).toEqual({ error: "入力は必須です" });
  });

  it("100文字以内は有効", () => {
    const input = "a".repeat(100);
    expect(validateInput(input)).toEqual({ valid: true });
  });

  it("101文字以上はエラーを返す", () => {
    const input = "a".repeat(101);
    expect(validateInput(input)).toEqual({ error: "100文字以内で入力してください" });
  });
});
```

### 結合テスト例

```tsx
// src/app/simulation/ConversationPanel.test.tsx
describe("ConversationPanel (Integration)", () => {
  it("メッセージ送信から応答受信まで", async () => {
    // APIモックのセットアップ
    server.use(
      rest.post("/api/chat", (req, res, ctx) => {
        return res(ctx.json({
          response: "こんにちは！元気ですか？",
          emotion: "happy"
        }));
      })
    );

    const { user } = render(<ConversationPanel />);

    // マイクボタンをクリック
    await user.click(screen.getByRole("button", { name: "マイク" }));

    // 音声認識結果をシミュレート
    act(() => {
      window.dispatchEvent(new CustomEvent("speechResult", {
        detail: { text: "こんにちは" }
      }));
    });

    // AIの応答が表示される
    await waitFor(() => {
      expect(screen.getByText("こんにちは！元気ですか？")).toBeInTheDocument();
    });

    // 3Dアバターの表情が変わる
    expect(screen.getByTestId("avatar-emotion")).toHaveAttribute("data-emotion", "happy");
  });
});
```

### E2Eテスト例

```typescript
// e2e/critical-path.spec.ts
test("完全な会話フロー：開始から評価まで", async ({ page }) => {
  // 1. トップページ
  await page.goto("http://localhost:3000");
  await expect(page.locator("h2")).toContainText("女子と話せるようになろう");

  // 2. シミュレーション開始
  await page.click('text=今すぐはなしかける');
  await page.waitForURL("**/simulation");

  // 3. 会話開始
  await page.click('[aria-label="マイク"]');
  await page.waitForSelector('[data-status="listening"]');

  // 4. 音声入力（モック）
  await page.evaluate(() => {
    window.postMessage({ type: "speech", text: "こんにちは" }, "*");
  });

  // 5. AI応答を待つ
  await expect(page.locator(".ai-message").first()).toBeVisible({ timeout: 10000 });

  // 6. 複数回の会話
  for (let i = 0; i < 3; i++) {
    await page.click('[aria-label="マイク"]');
    await page.evaluate(() => {
      window.postMessage({ type: "speech", text: "はい" }, "*");
    });
    await page.waitForTimeout(2000);
  }

  // 7. 会話終了
  await page.click('text=会話を終了');
  await page.waitForURL("**/feedback");

  // 8. フィードバック確認
  await expect(page.locator("h2")).toContainText("会話の振り返り");
  await expect(page.locator("text=良かった点")).toBeVisible();
  await expect(page.locator("text=改善点")).toBeVisible();

  // 9. スコア表示確認
  const score = await page.locator('[data-testid="conversation-score"]').textContent();
  expect(parseInt(score || "0")).toBeGreaterThan(0);
});
```

---

## テスト環境

- **テストフレームワーク**: Jest
- **テストライブラリ**: React Testing Library
- **環境**: jsdom (ブラウザ環境のシミュレーション)

## インストール済みパッケージ

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0"
  }
}
```

## ディレクトリ構造

```
frontend/
├── jest.config.js           # Jest設定ファイル
├── jest.setup.js            # テスト初期化ファイル
├── src/
│   └── app/
│       ├── layout.tsx
│       └── layout.test.tsx  # layoutコンポーネントのテスト
└── package.json
```

## テスト実行方法

### 1. 全テストを実行

```bash
cd frontend
pnpm test
```

### 2. ウォッチモードで実行（開発時推奨）

ファイルの変更を監視し、自動的にテストを再実行します。

```bash
pnpm test:watch
```

### 3. 特定のテストファイルのみ実行

```bash
pnpm test layout.test.tsx
```

### 4. カバレッジレポート付きで実行

```bash
pnpm test -- --coverage
```

## テストファイルの作成ルール

### 命名規則

- テストファイル名: `[コンポーネント名].test.tsx` または `[コンポーネント名].spec.tsx`
- テストファイルの配置: テスト対象のコンポーネントと同じディレクトリに配置

### テストファイルの基本構造

```tsx
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const { user } = render(<MyComponent />);
    const button = screen.getByRole("button");
    await user.click(button);
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

## 既存のテスト

### layout.test.tsx

`src/app/layout.tsx`のテストケース:

#### テストケース一覧

1. **子要素のレンダリングテスト**
   - 渡された子要素が正しくレンダリングされることを確認

2. **HTML lang属性テスト**
   - HTML要素に`lang="ja"`属性が設定されていることを確認

3. **suppressHydrationWarning属性テスト**
   - HTML要素に`suppressHydrationWarning`属性があることを確認

4. **フォントクラステスト**
   - body要素に正しいフォント変数とantialiasedクラスが適用されていることを確認

5. **metadataテスト**
   - titleが正しいことを確認
   - descriptionが正しいことを確認
   - icon pathが正しいことを確認

## トラブルシューティング

### よくあるエラーと解決方法

#### 1. `Cannot find module '@/...'`

**原因**: パスエイリアスが解決できない

**解決方法**: `jest.config.js`の`moduleNameMapper`を確認

```js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

#### 2. `ReferenceError: document is not defined`

**原因**: テスト環境がNode.jsのまま

**解決方法**: `jest.config.js`で`testEnvironment`を確認

```js
testEnvironment: 'jest-environment-jsdom',
```

#### 3. `toBeInTheDocument is not a function`

**原因**: `@testing-library/jest-dom`がセットアップされていない

**解決方法**: `jest.setup.js`に以下を追加

```js
import '@testing-library/jest-dom'
```

#### 4. Next.js関連のエラー

**原因**: Next.jsの設定が読み込まれていない

**解決方法**: `jest.config.js`で`next/jest`を使用していることを確認

```js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
```

## テスト作成のベストプラクティス

### 1. テストは独立させる

各テストケースは他のテストに依存しないように作成します。

```tsx
// ❌ 悪い例
let result;
it("test 1", () => {
  result = someFunction();
});
it("test 2", () => {
  expect(result).toBe(expected); // test 1に依存
});

// ✅ 良い例
it("test 1", () => {
  const result = someFunction();
  expect(result).toBe(expected);
});
it("test 2", () => {
  const result = someFunction();
  expect(result).toBe(expected);
});
```

### 2. ユーザーの視点でテストする

実装の詳細ではなく、ユーザーが見る・操作する内容をテストします。

```tsx
// ❌ 悪い例（実装の詳細をテスト）
expect(component.state.isOpen).toBe(true);

// ✅ 良い例（ユーザーが見る内容をテスト）
expect(screen.getByRole("dialog")).toBeVisible();
```

### 3. 意味のあるテスト名を付ける

テスト名を見ただけで何をテストしているか分かるようにします。

```tsx
// ❌ 悪い例
it("works", () => { ... });

// ✅ 良い例
it("displays error message when form is submitted with empty fields", () => { ... });
```

### 4. Arrange-Act-Assert パターンを使う

テストを3つのセクションに分けて構造化します。

```tsx
it("adds item to cart", () => {
  // Arrange: テストの準備
  render(<ShoppingCart />);
  const addButton = screen.getByRole("button", { name: "Add to Cart" });

  // Act: アクション実行
  userEvent.click(addButton);

  // Assert: 結果の検証
  expect(screen.getByText("1 item in cart")).toBeInTheDocument();
});
```

## CI/CD統合

### GitHub Actions での実行例

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.12.3
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
        working-directory: ./frontend
```

## 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [React Testing Library公式ドキュメント](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing ドキュメント](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)

## まとめ

- テストは `pnpm test` で実行
- 開発時は `pnpm test:watch` を使用
- テストファイルは対象コンポーネントと同じディレクトリに配置
- ユーザーの視点でテストを書く
- テストは独立させ、意味のある名前を付ける
