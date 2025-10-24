# テストディレクトリ構造

このディレクトリには、フロントエンドアプリケーションのすべてのテストファイルが含まれています。

## ディレクトリ構造

```
__tests__/
├── README.md           # このファイル
├── app/               # App Routerページのテスト
│   └── layout.test.tsx
├── components/        # コンポーネントのテスト（今後追加予定）
├── hooks/            # カスタムフックのテスト（今後追加予定）
└── lib/              # ユーティリティ関数のテスト（今後追加予定）
```

## テストの実行

### すべてのテストを実行
```bash
npm test
```

### ウォッチモードで実行
```bash
npm test -- --watch
```

### カバレッジレポートを生成
```bash
npm test -- --coverage
```

## テストファイルの命名規則

- テストファイルは `*.test.tsx` または `*.test.ts` の形式で命名
- テスト対象のファイルと同じ名前を使用（例：`layout.tsx` → `layout.test.tsx`）
- `__tests__` ディレクトリ内のディレクトリ構造は、`src/` の構造を反映

## テストの書き方

### 基本的なテスト例

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### メタデータのテスト例

```typescript
import { metadata } from '@/app/layout';

describe('Layout metadata', () => {
  it('has correct title', () => {
    expect(metadata.title).toBe('Expected Title');
  });
});
```

## 使用しているテストツール

- **Jest**: テストランナー
- **@testing-library/react**: Reactコンポーネントのテスト
- **@testing-library/jest-dom**: カスタムマッチャー

## 今後の拡張

以下のテストを追加する予定：

- [ ] コンポーネントのテスト（Avatar, ConversationHistory など）
- [ ] カスタムフックのテスト（useVRM, useMediaDevices など）
- [ ] APIクライアントのテスト
- [ ] ユーティリティ関数のテスト
