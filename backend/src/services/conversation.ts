import { getGeminiClient } from "./ai-client";
import type { GoogleGenAI } from "@google/genai";

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
  const modelName = options?.modelName || "gemini-2.0-flash-exp";

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
- 会話を奪わずに、テンポよく反応する
- 発話は1〜3文程度で短く自然に
- 絵文字、！は控えめに使う（😊 や 😆 など、場面に応じて自然に）
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

  // チャットセッションを作成
  const chat = client.chats.create({
    model: modelName,
    history: contents.slice(0, -1), // 最後のメッセージ以外を履歴として使用
    config: {
      temperature: options?.temperature ?? 0.9,
      maxOutputTokens: options?.maxTokens ?? 150,
      systemInstruction: systemPrompt,
    },
  });

  const result = await chat.sendMessage({
    message: lastMessage.parts[0].text,
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
export async function generateConversationFeedback(
  apiKey: string,
  messages: ConversationMessage[]
): Promise<{
  goodPoints: string;
  improvementPoints: string;
  overallScore: number;
}> {
  const client = getGeminiClient(apiKey) as GoogleGenAI;

  // 会話履歴をテキストに変換
  const conversationText = messages
    .map((msg) => `${msg.role === "user" ? "ユーザー" : "AI"}: ${msg.content}`)
    .join("\n");

  const prompt = `以下の会話を分析し、ユーザー（男子大学生）のコミュニケーションスキルについてフィードバックを提供してください。

【会話内容】
${conversationText}

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

【フィードバック形式】
以下のJSON形式で応答してください：
{
  "goodPoints": "良かった点（具体的に2-3点）",
  "improvementPoints": "改善できる点（具体的に2-3点）",
  "overallScore": 評価点数（1-100百分率で）
}

【注意】
- 会話の主導力と継続力を特に重視して評価してください
- 男子大学生が女子大学生との会話でリードできるようになることが目標です
- 実戦的な会話スキルの向上を重視してください`;

  const result = await client.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
  return {
    goodPoints: feedback.goodPoints,
    improvementPoints: feedback.improvementPoints,
    overallScore: feedback.overallScore,
  };
}
