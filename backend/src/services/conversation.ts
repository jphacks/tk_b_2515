import { getGeminiClient } from "./ai-client";
import type { GoogleGenAI } from "@google/genai";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  systemPrompt?: string;
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

  // システムプロンプトのデフォルト設定
  const systemPrompt =
    context.systemPrompt ||
    `あなたは恋愛会話の練習相手です。ユーザーと自然な会話を通じて、コミュニケーションスキルの向上をサポートします。
以下の点に注意して応答してください：
- 親しみやすく、自然な話し方で応答する
- ユーザーの話に共感を示す
- 会話を続けやすいように適切な質問を投げかける
- 短めの応答を心がける（1-3文程度）
- 日本語で応答する`;

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

  const prompt = `以下の会話を分析し、ユーザーのコミュニケーションスキルについてフィードバックを提供してください。

【会話内容】
${conversationText}

【フィードバック形式】
以下のJSON形式で応答してください：
{
  "goodPoints": "良かった点（具体的に2-3点）",
  "improvementPoints": "改善できる点（具体的に2-3点）",
  "overallScore": 評価点数（1-100百分率で）
}

評価基準：
- 話題の展開力
- 共感力や傾聴姿勢
- 質問の適切さ
- 会話の自然さ`;

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
