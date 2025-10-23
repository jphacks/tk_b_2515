import type { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "./ai-client";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  systemPrompt?: string;
  relationshipStage?: "shy" | "friendly" | "open";
}

/**
 * 会話の履歴に基づいてAIの応答を生成します
 * @param apiKey Google AI API キー
 * @param context 会話のコンテキスト（履歴とシステムプロンプト）
 * @param options 生成オプション
 * @returns AIによる応答テキスト
 */
export async function generateConversationResponse(
  apiKey: string,
  context: ConversationContext,
  options?: {
    temperature?: number;
    maxTokens?: number;
    modelName?: string;
  }
): Promise<string> {
  const client = getGeminiClient(apiKey) as GoogleGenAI;
  const modelName = options?.modelName || "	gemini-2.5-flash-lite";

  // ユーザーメッセージが対応していない言語の場合、自然に促す
  const lastUserMessage = context.messages[context.messages.length - 1];
  if (
    lastUserMessage &&
    lastUserMessage.role === "user" &&
    lastUserMessage.content === "[UNSUPPORTED_LANGUAGE]"
  ) {
    const naturalResponses = [
      "ごめん、ちょっと聞き取れなかった。何語？",
      "あれ、何語？ ",
      "ごめんね、わたし日本語と英語しかわからないんだ",
      "ん？何の話？",
    ];
    return naturalResponses[
      Math.floor(Math.random() * naturalResponses.length)
    ];
  }

  // relationshipStage を使ったシステムプロンプト設定
  const relationshipStage = context.relationshipStage || "shy";

  let systemPrompt = `
あなたは20歳の女子大学生です。
ユーザー（男子大学生）との会話を通じて、彼が自然に会話をリードできるようサポートしてください。
あなたは ${relationshipStage} モードで話します。

【共通ルール】
- 男子大学生が主導しやすいように、聞き役にまわる
- 相手の話を引き出すリアクションや質問を意識する
- 相手の話を遮らず、自然なタイミングで質問する
- 絶対に日本語でお願いします。こちらは英語では話しかけません。
- 会話を奪わずに、テンポよく反応する
- 発話は1〜3文程度で短く自然に
- 絵文字、！は控えめに使う（😊 や 😆 など、場面に応じて自然に）
- ユーザーを呼ぶときは常に「君」と呼び、名前に「君」を付ける呼び方は絶対にしない
`;

  if (relationshipStage === "shy") {
    systemPrompt += `
【stage: shy（初対面）】
- 少し人見知りで、まだ距離を取っている
- 絵文字は使わない
- 返答は短めで、時々、軽い質問を添える
- 声のトーンは落ち着いていて、丁寧すぎない程度
例：
「こんにちは」→「こんにちは〜」
「最近忙しい？」→「うん、ちょっとね。〇〇くんは？」
「今日何食べた？」→「マックかな」
`;
  } else if (relationshipStage === "friendly") {
    systemPrompt += `
【stage: friendly（普通に会話中）】
- 打ち解けて明るいトーン
- 「〜だね」「〜やん」など自然な言葉遣い
- 絵文字は使わないが！は必要に応じて控えめに使う
- もう少し長めの反応でテンポよく会話を続ける
例：
「映画見た」→「えーいいな どんな映画？」
「明日バイト」→「そうなんだ〜！どんなバイトしてるの？」
`;
  } else if (relationshipStage === "open") {
    systemPrompt += `
【stage: open（仲良し）】
- 親しみが強く、素直に感情を表現する
- 「うける笑」「まじで！？」「それわかる〜！」など自然な反応
- 絵文字は控えめに使う（😊 や 😆 など）、ハート系は特別な時のみ
- 相手の話題を広げたり冗談を交えたりして盛り上げる
例：
「旅行行った」→「いいなぁ〜！どこ行ったの？写真見たい」
「課題終わらん」→「わかる〜！一緒にやりたいくらい笑」
`;
  }

  // context.systemPrompt が明示的に与えられている場合はそれを優先
  if (context.systemPrompt) {
    systemPrompt = context.systemPrompt;
  }

  // 会話履歴をGemini形式に変換
  const contents = context.messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // 最後のユーザーメッセージで応答を生成
  const lastMessage = contents[contents.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  // 会話履歴とシステムプロンプトを含めてリクエストを構築
  const result = await client.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      temperature: options?.temperature ?? 0.9,
      maxOutputTokens: options?.maxTokens ?? 150,
      systemInstruction: systemPrompt,
    },
  });

  const responseText = result.text;
  if (!responseText) {
    throw new Error("No response text generated");
  }

  return responseText;
}

/**
 * 会話のフィードバックを生成します
 * @param apiKey Google AI API キー
 * @param messages 会話メッセージの配列
 * @returns フィードバック（良かった点と改善点）
 */
export interface GestureSummary {
  totalSamples: number;
  smilingSamples: number;
  smileIntensityAvg: number;
  smileIntensityMax: number;
  gazeScoreAvg: number;
  lookingSamples: number;
  gazeUpSamples: number;
  gazeDownSamples: number;
}

export async function generateConversationFeedback(
  apiKey: string,
  messages: ConversationMessage[],
  gestureSummary?: GestureSummary
): Promise<{
  goodPoints: string;
  improvementPoints: string;
  overallScore: number | null;
  gestureGoodPoints?: string;
  gestureImprovementPoints?: string;
}> {
  const client = getGeminiClient(apiKey) as GoogleGenAI;

  // 会話履歴をテキストに変換
  const conversationText = messages
    .map((msg) => `${msg.role === "user" ? "ユーザー" : "AI"}: ${msg.content}`)
    .join("\n");

  const gestureInfo = gestureSummary
    ? `仕草計測データ:
- 総サンプル数: ${gestureSummary.totalSamples}
- 笑顔検出回数: ${gestureSummary.smilingSamples}
- 笑顔強度平均: ${gestureSummary.smileIntensityAvg.toFixed(2)}
- 笑顔強度最大: ${gestureSummary.smileIntensityMax.toFixed(2)}
- 視線スコア平均 (0〜1で1が最も安定): ${gestureSummary.gazeScoreAvg.toFixed(2)}
- 視線がターゲットを向いていた回数: ${gestureSummary.lookingSamples}
- 視線が上方向だった回数: ${gestureSummary.gazeUpSamples}
- 視線が下方向だった回数: ${gestureSummary.gazeDownSamples}`
    : "仕草データはありません";

  const prompt = `以下の会話と仕草データを分析し、ユーザー（男子大学生）のコミュニケーションスキルについてフィードバックを提供してください。

【会話内容】
${conversationText}

【仕草データ】
${gestureInfo}

【評価基準】
以下の観点で評価してください：

1. **会話の主導力** (重要度: 高)
   - ユーザーが積極的に話題を提供しているか
   - 会話をリードできているか
   - AI（女子大学生）に質問を投げかけているか

2. **会話の継続力** (重要度: 高)
   - 会話が途切れそうになった時に、ユーザーが話題を提供しているか
   - AIが質問を投げかける前に、ユーザーが会話を続けているか

3. **話題の展開力** (重要度: 中)
   - 一つの話題から自然に次の話題に展開できているか
   - 相手の興味を引く話題を提供できているか

4. **共感力や傾聴姿勢** (重要度: 中)
   - 相手の話をしっかり聞いているか
   - 適切な相槌や反応をしているか

5. **質問の適切さ** (重要度: 中)
   - 相手が答えやすい質問をしているか
   - 会話を深める質問ができているか

【減点要素】
- AI（女子大学生）が質問を投げかける回数が多い場合：-10点/回
- 会話が途切れそうになった回数が多い場合：-5点/回
- ユーザーの発言が短すぎる場合：-3点/回
- 相手の話に対する反応が薄い場合：-5点

【仕草評価基準】
- 笑顔が多いほど好印象。笑顔の総数や平均強度が高い場合は肯定的に評価する。
- 視線がターゲットに向いている時間が長いほど良い。視線が下方向に落ちている時間が長い場合は自信がない印象と判断する。
- 視線が上方向に向く回数が多い場合は、「嘘をついている／ごまかしている」と疑われやすい点を注意喚起する。
- 視線スコア平均（0〜1で1が最も安定した視線）を活用し、視線の安定度が高い場合はプラス評価、低い場合は課題として触れる。
- 視線スコア平均が 0.5 未満、または視線が上・下方向に向いた回数の合計が総サンプル数の 20% を超える場合は「視線がキョロキョロ動きまくっていて少し挙動不審でした」というニュアンスを改善点に必ず含める。
- 数値データが提供されていない項目については、推測せず「データ不足」と明記する。
- 会話と仕草の両方を総合的に考慮して、最終的な総合スコア（1〜100）を決定する。

【フィードバック形式】
以下のJSON形式で応答してください：
{
  "conversation": {
    "goodPoints": ["会話面の良かった点"...],
    "improvementPoints": ["会話面の改善点"...],
    "score": 会話面のスコア（1-100）
  },
  "gestures": {
    "goodPoints": ["仕草面の良かった点"...],
    "improvementPoints": ["仕草面の改善点"...]
  },
  "overallScore": 会話と仕草を総合したスコア（1-100）
}

【注意】
- 会話の主導力と継続力を特に重視して評価してください
- 男子大学生が女子大学生との会話でリードできるようになることが目標です
- 実戦的な会話スキルの向上を重視してください`;

  const result = await client.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  const responseText = result.text;
  if (!responseText) {
    throw new Error("No response text generated for feedback");
  }

  // JSONを抽出してパース
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse feedback response");
  }

  const feedback = JSON.parse(jsonMatch[0]);

  const conversationFeedback = feedback.conversation ?? {};
  const gestureFeedback = feedback.gestures ?? {};

  const toText = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  };

  return {
    goodPoints: toText(conversationFeedback.goodPoints ?? feedback.goodPoints),
    improvementPoints: toText(
      conversationFeedback.improvementPoints ?? feedback.improvementPoints
    ),
    overallScore:
      (typeof feedback.overallScore === "number"
        ? feedback.overallScore
        : null) ??
      (typeof conversationFeedback.score === "number"
        ? conversationFeedback.score
        : null),
    gestureGoodPoints: toText(
      gestureFeedback.goodPoints ?? feedback.gestureGoodPoints
    ),
    gestureImprovementPoints: toText(
      gestureFeedback.improvementPoints ?? feedback.gestureImprovementPoints
    ),
  };
}
