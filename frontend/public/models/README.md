# VRMモデルの配置方法

このディレクトリにVRMモデルファイル（`.vrm`）を配置してください。

## VRMモデルの入手方法

### 1. 無料のVRMモデルをダウンロード

以下のサイトから無料のVRMモデルをダウンロードできます：

#### VRoid Hub（推奨）
- URL: https://hub.vroid.com/
- 無料で商用利用可能なモデルが多数
- ダウンロード手順:
  1. VRoid Hubにアクセス
  2. 好きなキャラクターを選択
  3. ライセンスを確認（商用利用可能なものを選ぶ）
  4. 「Download」ボタンからVRMファイルをダウンロード
  5. ダウンロードしたファイルを `avatar.vrm` という名前に変更
  6. このディレクトリに配置

#### ニコニ立体
- URL: https://3d.nicovideo.jp/
- VRMフォーマットのモデルを検索

#### BOOTH
- URL: https://booth.pm/
- 有料・無料のVRMモデルが販売されている

### 2. VRoid Studioで自作

VRoid Studio（無料）を使って自分でキャラクターを作成：

1. VRoid Studioをダウンロード: https://vroid.com/studio
2. キャラクターを作成
3. VRM形式でエクスポート
4. エクスポートしたファイルを `avatar.vrm` に変更
5. このディレクトリに配置

## ファイル配置

```
frontend/public/models/
├── avatar.vrm          <- メインのVRMモデル
├── avatar-alt.vrm      <- 代替モデル（オプション）
└── README.md
```

## 使用方法

モデルを配置したら、アプリケーションで以下のパスで参照できます：

```typescript
const avatarModelUrl = "/models/avatar.vrm";
```

## 開発用テストモデル

開発中、モデルがない場合は以下の公式サンプルをダウンロードできます：

- VRM Consortium サンプルモデル
  - URL: https://github.com/vrm-c/vrm-specification/tree/master/samples
  - `Alicia.vrm` など

## ライセンス注意事項

- VRMモデルを使用する際は、必ずライセンス条項を確認してください
- 商用利用の場合は、商用利用可能なライセンスのモデルを選択してください
- 配信や公開する場合は、モデル作者のクレジット表記が必要な場合があります

## トラブルシューティング

### モデルが表示されない場合

1. ファイル名が正確に `avatar.vrm` になっているか確認
2. ファイルが `/frontend/public/models/` ディレクトリに配置されているか確認
3. ブラウザのコンソールでエラーメッセージを確認
4. 開発サーバーを再起動

### パフォーマンスが悪い場合

- VRMモデルのポリゴン数が多すぎる可能性があります
- より軽量なモデルを使用するか、VRoid Studioでポリゴン数を削減してエクスポート
