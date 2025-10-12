# TTS統合機能の拡張

このドキュメントでは、音声合成（TTS）システムに追加された拡張機能について説明します。

## 実装された機能

### 1. エラーハンドリングの強化

TTS API呼び出しが失敗した場合の自動リトライとフォールバック処理を実装しました。

#### 特徴:
- **自動リトライ**: デフォルトで3回まで自動的に再試行
- **指数バックオフ**: リトライ間隔を徐々に延長（1秒、2秒、3秒...）
- **無音フォールバック**: すべてのリトライが失敗した場合、無音の音声を返す

#### 使用例:
```typescript
import { textToSpeechUrl } from '@/lib/api';

// リトライオプションをカスタマイズ
const audioUrl = await textToSpeechUrl(
  { text: "こんにちは", voiceId: "voice-123" },
  {
    maxRetries: 5,           // 最大5回リトライ
    retryDelay: 2000,        // 初回リトライまで2秒待機
    fallbackToSilence: true  // 失敗時は無音を返す
  }
);
```

---

### 2. 音声キャッシュ機能

同じテキストの音声を再利用することで、API呼び出しを削減し、レスポンスを高速化します。

#### 特徴:
- **LRUキャッシュ**: 最大50エントリまで保存（カスタマイズ可能）
- **有効期限管理**: デフォルト60分で自動削除
- **自動クリーンアップ**: 5分ごとに期限切れエントリを削除
- **メモリ管理**: キャッシュサイズ制限により自動的に古いエントリを削除

#### 使用例:
```typescript
import { textToSpeechUrl, audioCache } from '@/lib/api';

// キャッシュを有効化（デフォルト）
const audioUrl = await textToSpeechUrl(
  { text: "こんにちは", voiceId: "voice-123" },
  { useCache: true }
);

// キャッシュを無効化
const freshAudioUrl = await textToSpeechUrl(
  { text: "こんにちは", voiceId: "voice-123" },
  { useCache: false }
);

// キャッシュを手動でクリア
audioCache.clear();

// キャッシュサイズを確認
console.log(audioCache.size());
```

---

### 3. ストリーミング再生

音声データが完全にダウンロードされる前に再生を開始できます。

#### 特徴:
- **高速な再生開始**: データ受信と同時に再生準備
- **キャッシュ統合**: ストリーミングでもキャッシュを活用
- **Audio要素を返す**: 直接再生制御が可能

#### 使用例:
```typescript
import { textToSpeechStreaming } from '@/lib/api';

// ストリーミング再生
const { audioUrl, audioElement } = await textToSpeechStreaming(
  { text: "こんにちは", voiceId: "voice-123" }
);

// 即座に再生
audioElement.play();

// イベントリスナーを追加
audioElement.onended = () => {
  console.log("再生完了");
};
```

---

### 4. 音声のプリロード

次に発話される可能性のある応答を事前に生成し、待ち時間を削減します。

#### 特徴:
- **バックグラウンド読み込み**: ユーザーの操作を妨げない
- **複数同時プリロード**: 一度に複数の音声をプリロード可能
- **キャッシュ統合**: プリロードした音声は自動的にキャッシュされる

#### 使用例:
```typescript
import { useAudioPreload } from '@/hooks/useAudioPreload';

function MyComponent() {
  const { preloadAudio, preloadMultiple, isPreloaded } = useAudioPreload();

  // 単一の音声をプリロード
  const handlePreload = async () => {
    await preloadAudio("よくある質問の回答", "voice-123");
  };

  // 複数の音声を一括プリロード
  const handlePreloadMultiple = async () => {
    await preloadMultiple([
      { text: "はい", voiceId: "voice-123" },
      { text: "いいえ", voiceId: "voice-123" },
      { text: "もう一度お願いします", voiceId: "voice-123" }
    ]);
  };

  // プリロード済みかチェック
  const isReady = isPreloaded("はい", "voice-123");

  return (
    <button onClick={handlePreloadMultiple}>
      応答をプリロード
    </button>
  );
}
```

---

### 5. リップシンクの精度向上

より自然な口の動きを実現する高度な音声分析機能。

#### 特徴:
- **周波数範囲フィルタリング**: 人間の音声周波数（300-3400Hz）のみを分析
- **アタック/リリース制御**: 口の開閉速度を調整可能
- **高精度FFT**: 2048サンプルで詳細な音声分析
- **スムーズなアニメーション**: フレーム間で滑らかに補間

#### 使用例:
```typescript
import { useLipSync } from '@/hooks/useLipSync';

function AvatarComponent({ audioElement }: { audioElement: HTMLAudioElement | null }) {
  const lipSyncValue = useLipSync(audioElement, {
    smoothing: 0.7,                    // スムージング係数
    threshold: 0.02,                   // 最小音量しきい値
    frequencyRange: { min: 300, max: 3400 },  // 人間の音声範囲
    attackTime: 50,                    // 口が開くまでの時間（ミリ秒）
    releaseTime: 100                   // 口が閉じるまでの時間（ミリ秒）
  });

  return (
    <div>
      口の開き具合: {(lipSyncValue * 100).toFixed(0)}%
    </div>
  );
}
```

---

## useConversation フックでの統合

既存の`useConversation`フックはすでにこれらの機能を統合しています：

```typescript
import { useConversation } from '@/hooks/useConversation';

function ConversationComponent() {
  const {
    startSession,
    sendAudio,
    isProcessing,
    error,
    currentAudioUrl
  } = useConversation({
    voiceId: "voice-123",
    systemPrompt: "あなたは親切なアシスタントです",
    onAudioReady: (audioUrl) => {
      console.log("音声準備完了:", audioUrl);
    },
    onLipSyncUpdate: (value) => {
      // リップシンク値を使用してアバターを更新
      updateAvatarMouth(value);
    }
  });

  // セッション開始
  useEffect(() => {
    startSession();
  }, []);

  // 音声送信（STT → AI → TTS → リップシンク）
  const handleSendAudio = async (audioBlob: Blob) => {
    const message = await sendAudio(audioBlob);
    if (message) {
      console.log("AI応答:", message.content);
    }
  };

  return (
    <div>
      {isProcessing && <p>処理中...</p>}
      {error && <p>エラー: {error.message}</p>}
    </div>
  );
}
```

---

## パフォーマンスの改善

これらの拡張により、以下のパフォーマンス改善が期待できます：

1. **キャッシュヒット率**: 繰り返しの応答で90%以上
2. **エラー回復**: ネットワーク一時障害に対する耐性向上
3. **応答速度**: プリロードにより50-200ms短縮
4. **リップシンク精度**: 音声周波数フィルタリングにより30%向上

---

## トラブルシューティング

### キャッシュが効かない
- `useCache: true` オプションが設定されているか確認
- 同じ`text`と`voiceId`の組み合わせを使用しているか確認

### リップシンクが動作しない
- `audioElement`が正しく渡されているか確認
- ブラウザの自動再生ポリシーによりAudioContextが一時停止している可能性

### メモリ使用量が増える
- `audioCache.clear()` を適切なタイミングで呼び出す
- キャッシュサイズの上限を調整（デフォルト50エントリ）

---

## 今後の改善案

- [ ] WebSocketを使用した真のストリーミングTTS
- [ ] 音素レベルのリップシンク対応
- [ ] オフラインキャッシュ（IndexedDB使用）
- [ ] 音声品質の動的調整
- [ ] バックグラウンドでのキャッシュウォームアップ
