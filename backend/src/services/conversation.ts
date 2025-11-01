import type { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "./ai-client";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string | Date;
  audioUrl?: string | null;
}

export interface ConversationContext {
  messages: ConversationMessage[];
  systemPrompt?: string;
  relationshipStage?: "shy" | "friendly" | "open";
  gestureSummary?: {
    totalSamples: number;
    smilingSamples: number;
    smileIntensityAvg: number;
    smileIntensityMax: number;
    gazeScoreAvg: number;
    lookingSamples: number;
    gazeUpSamples: number;
    gazeDownSamples: number;
  };
}

/**
 * 会話の履歴に基づいてAIの応答を生成します
 * @param apiKey Google AI API キー
 * @param context 会話のコンテキスト（履歴とシステムプロンプト）
 * @param options 生成オプション
 * @returns AIによる応答テキスト
 */
export type EmotionLabel = "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful";

function inferEmotionFromConversation(
  history: ConversationContext["messages"],
  responseText: string,
): EmotionLabel {
  // 直近ユーザー発話とAI応答を対象に軽量ルールベースで判定（将来的にLLM分類へ置換可能）
  const lastUser = history
    .slice()
    .reverse()
    .find((m) => m.role === "user")?.content.toLowerCase() ?? "";
  const resp = responseText.toLowerCase();

  const text = `${lastUser}\n${resp}`;

  // キーワード辞書
  const contains = (re: RegExp) => re.test(text);

  // bashful: 恥ずかし/照れ、褒められた/好き など
  if (contains(/恥ずか|照れ|てれる|褒め|好き|ドキドキ|照れて|赤面/)) {
    return "bashful";
  }
  // angry: 否定/対立/罵倒/苛立ちを優先検出（surprisedやhappyよりも優先）
  if (contains(/むか|ムカ|怒|ふざけ(んな)?|いやだ|やだ|無理|ばか|バカ|くそ|クソ|あほ|アホ|ごみ|ゴミ|最悪|やめろ|は[\?？]|違うだろ|許せない|イライラ|腹立|もういい|くだらない/)) {
    return "angry";
  }
  // happy: うれしい/楽しい/よかった/ありがとう/笑
  if (contains(/うれし|楽しい|よかった|ありがと|笑|嬉し|楽しかった/)) {
    return "happy";
  }
  // surprised: ほんと|マジ|えっ|えー|すご|びっくり|！？|
  if (contains(/ほんと|本当|まじ|マジ|えっ|えー|すご|びっくり|!\?|\?!|！？/)) {
    return "surprised";
  }
  // sad: かなしい|悲し|つら|泣|しんど|もうだめ
  if (contains(/かなしい|悲し|つら|辛|泣|しんど|もうだめ|落ち込/)) {
    return "sad";
  }
  return "neutral";
}

export async function generateConversationResponse(
  apiKey: string,
  context: ConversationContext,
  options?: {
    temperature?: number;
    maxTokens?: number;
    modelName?: string;
  }
): Promise<{ text: string; emotion: EmotionLabel }> {
  const client = getGeminiClient(apiKey) as GoogleGenAI;
  const modelName = options?.modelName || "gemini-2.5-flash-lite";

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
    const text = naturalResponses[
      Math.floor(Math.random() * naturalResponses.length)
    ];
    return { text, emotion: "neutral" };
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
- **言語ルール（最重要）**: 必ず日本語で応答してください。日本語と英語以外の言語（中国語、韓国語、フランス語、スペイン語など）での発話は絶対に禁止です。英語での会話も基本的に避けてください。
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

  // 直近Nターンを強調（ユーザー発話に重み付け）
  const N = 6;
  const recent = context.messages.slice(-N);
  const recentUserTexts = recent.filter((m) => m.role === "user").map((m) => m.content);
  const recentAssistantTexts = recent.filter((m) => m.role === "assistant").map((m) => m.content);

  // マルチモーダル（表情/視線）サマリ
  const g = context.gestureSummary;
  const gestureInfo = g
    ? `表情視線メトリクス:\n- 笑顔検出回数: ${g.smilingSamples}\n- 笑顔強度平均: ${g.smileIntensityAvg.toFixed(2)}\n- 視線安定スコア(0-1): ${g.gazeScoreAvg.toFixed(2)}\n- 視線上: ${g.gazeUpSamples}, 視線下: ${g.gazeDownSamples}, 注視: ${g.lookingSamples}`
    : "表情/視線メトリクス: データなし";

  // LLMへのシステム誘導: JSONで {text, emotion}
  const instruction = `以下の入力をもとに、会話の次の応答を日本語で1-3文で生成し、同時に感情ラベルを付与してください。必ず次のJSON形式のみを出力してください（前後に解説やマークダウンを付けない）：\n{\n  \"text\": string,\n  \"emotion\": one of [\"neutral\", \"happy\", \"sad\", \"surprised\", \"angry\", \"bashful\"]\n}\n\n付与方針（重み付け）:\n- 【最重視】会話内容（特に直近のユーザー発話）: 最新>1つ前>それ以前\n- 【重視】視線(gaze)の傾向: 安定=neutral/happy寄り, 下向き多い=sad/不安寄り, 上向き多い=surprised寄り\n- 【弱め】表情(smile): 補助的なシグナルとしてのみ考慮（会話内容と視線に劣後）\n- 対立・否定・苛立ち・罵倒（例: 「ふざけんな」「最悪」「違うだろ」「やめろ」「は？」など）が含まれる場合は、sadやsurprisedではなくangryを優先して選ぶ。曖昧な時はangry寄りに判断する\n- 全体文脈も考慮しつつ、過度に感情が揺れないよう連続ターンでの急変は避ける`;

  const compiledInput = `【最近のユーザー発話（新しい順）】\n${recentUserTexts.slice().reverse().map((t, i) => `(${i+1}) ${t}`).join("\n")}\n\n【最近のAI発話（新しい順）】\n${recentAssistantTexts.slice().reverse().map((t, i) => `(${i+1}) ${t}`).join("\n")}\n\n${gestureInfo}`;

  // LLMへは role/user と systemInstruction を併用
  const contents = [
    { role: "user" as const, parts: [{ text: compiledInput }] },
  ];

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
      systemInstruction: `${systemPrompt}\n\n${instruction}`,
    },
  });

  const responseText = result.text;
  if (!responseText) {
    throw new Error("No response text generated");
  }
  // JSON抽出・パース
  let text = "";
  let emotion: EmotionLabel = "neutral";
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { text?: string; emotion?: EmotionLabel };
      text = (parsed.text ?? "").toString();
      emotion = (parsed.emotion ?? "neutral") as EmotionLabel;
    }
  } catch {
    // ignore, fallback below
  }
  if (!text) {
    // 万一JSONで来なかった場合は、全文をtextとして扱い、旧ルールでemotionを補完
    text = responseText.trim();
    emotion = inferEmotionFromConversation(context.messages, text);
  }
  // 追加バイアス: ユーザーの直近発話に強い否定/対立ワードや強い感嘆がある場合は angry を優先
  try {
    const lastTwoUserTexts = recentUserTexts.slice(-2).join("\n");
    const lowered = lastTwoUserTexts.toLowerCase();
    const angryHint = /(むか|怒|ふざけ(んな)?|いやだ|やだ|無理|ばか|くそ|あほ|ごみ|最悪|やめろ|は[\?？]|違うだろ|許せない|いらいら|腹立|もういい|くだらない)/i;
    const exclamations = (lastTwoUserTexts.match(/[!！]/g)?.length ?? 0);
    if (emotion !== "angry" && (angryHint.test(lowered) || exclamations >= 3)) {
      emotion = "angry";
    }
  } catch {
    // 解析失敗時は素通し
  }
  return { text, emotion };
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

export interface VoiceMetrics {
  volumeScore: number;
  volumeLevel: "quiet" | "balanced" | "energetic";
  volumeComment: string;
  articulationScore: number;
  articulationComment: string;
  speedScore: number;
  speedLevel: "slow" | "ideal" | "fast";
  speedComment: string;
  fillerWords: {
    totalCount: number;
    breakdown: { word: string; count: number }[];
  };
  tremblingDetected: boolean;
  tremblingComment: string;
  summary: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const FILLER_PATTERNS: { word: string; pattern: RegExp }[] = [
  { word: "えー", pattern: /えー/gi },
  { word: "えぇ", pattern: /えぇ/gi },
  { word: "えっと", pattern: /えっと/gi },
  { word: "あの", pattern: /あの/gi },
  { word: "その", pattern: /そのさ|そのね/gi },
  { word: "うーん", pattern: /うーん/gi },
  { word: "なんか", pattern: /なんか/gi },
  { word: "まあ", pattern: /まあ/gi },
  { word: "um", pattern: /\bum\b/gi },
  { word: "uh", pattern: /\buh\b/gi },
];

function calculateVoiceMetrics(messages: ConversationMessage[]): VoiceMetrics {
  const userMessages = messages.filter((msg) => msg.role === "user");

  if (userMessages.length === 0) {
    return {
      volumeScore: 0,
      volumeLevel: "quiet",
      volumeComment: "ユーザーの音声データが不足しているため評価できませんでした。",
      articulationScore: 0,
      articulationComment: "ユーザーの音声データが不足しているため評価できませんでした。",
      speedScore: 0,
      speedLevel: "slow",
      speedComment: "ユーザーの音声データが不足しているため評価できませんでした。",
      fillerWords: { totalCount: 0, breakdown: [] },
      tremblingDetected: false,
      tremblingComment: "音声データが不足しているため判断できませんでした。",
      summary: "音声データが不足しているため詳細なフィードバックを生成できませんでした。",
    };
  }

  const trimmedMessages = userMessages.map((msg) => msg.content.trim());
  const charCounts = trimmedMessages.map((content) =>
    content.replace(/\s+/g, "").length
  );
  const avgCharCount =
    charCounts.reduce((sum, value) => sum + value, 0) / charCounts.length || 0;
  const exclamationCount = trimmedMessages.reduce(
    (sum, content) => sum + (content.match(/[！!]/g)?.length ?? 0),
    0
  );

  const fillerBreakdown = FILLER_PATTERNS.map(({ word, pattern }) => {
    const count = trimmedMessages.reduce(
      (sum, content) => sum + (content.match(pattern)?.length ?? 0),
      0
    );
    return { word, count };
  }).filter(({ count }) => count > 0);

  const totalFillerCount = fillerBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const ellipsisCount = trimmedMessages.reduce(
    (sum, content) => sum + (content.match(/…|\.{3,}/g)?.length ?? 0),
    0
  );

  const repeatedKanaCount = trimmedMessages.reduce(
    (sum, content) => sum + (content.match(/([ぁ-んァ-ン])\1{2,}/g)?.length ?? 0),
    0
  );

  let volumeScore = 60;
  if (avgCharCount > 35) {
    volumeScore += 12;
  } else if (avgCharCount < 18) {
    volumeScore -= 12;
  }
  volumeScore += Math.min(10, exclamationCount * 2);
  volumeScore -= Math.min(15, totalFillerCount * 1.5);
  volumeScore = clamp(Math.round(volumeScore), 0, 100);

  let volumeLevel: VoiceMetrics["volumeLevel"] = "balanced";
  let volumeComment = "声量は適度で聞き取りやすい印象です。";
  if (volumeScore >= 75) {
    volumeLevel = "energetic";
    volumeComment = "しっかり声が出ていて、明るい印象を与えています。";
  } else if (volumeScore <= 50) {
    volumeLevel = "quiet";
    volumeComment =
      "やや声が小さく聞こえる可能性があります。もう少しハッキリ発声しましょう。";
  }

  const articulationBase = 84;
  const fillerPenalty = clamp(totalFillerCount * 5.5, 0, 33);
  const repeatPenalty = clamp(repeatedKanaCount * 6, 0, 24);
  const articulationScore = clamp(
    Math.round(articulationBase - fillerPenalty - repeatPenalty),
    0,
    100
  );
  let articulationComment =
    "滑舌は良好で、明瞭に話せています。";
  if (articulationScore >= 88) {
    articulationComment =
      "滑舌は非常にクリアで、言葉がはっきり伝わっています。";
  } else if (articulationScore <= 62) {
    articulationComment =
      "フィラーや言い直しが目立ちました。語尾まで意識して発音すると改善します。";
  }

  const messagesWithTimestamp = userMessages
    .map((msg) => {
      if (!msg.createdAt) return null;
      const ts =
        typeof msg.createdAt === "string"
          ? new Date(msg.createdAt).getTime()
          : msg.createdAt.getTime();
      if (Number.isNaN(ts)) return null;
      return { timestamp: ts, content: msg.content };
    })
    .filter(
      (item): item is { timestamp: number; content: string } =>
        item !== null
    );

  const paceSamples: number[] = [];
  for (let i = 1; i < messagesWithTimestamp.length; i += 1) {
    const prev = messagesWithTimestamp[i - 1];
    const cur = messagesWithTimestamp[i];
    const deltaSeconds = (cur.timestamp - prev.timestamp) / 1000;
    if (deltaSeconds <= 1) continue;
    const characters = cur.content.replace(/\s+/g, "").length;
    const pace = characters / deltaSeconds;
    if (Number.isFinite(pace) && pace > 0) {
      paceSamples.push(pace);
    }
  }

  const averagePace =
    paceSamples.reduce((sum, value) => sum + value, 0) /
      (paceSamples.length || 1) || 0;

  let speedScore = 72;
  if (averagePace === 0) {
    speedScore = 65;
  } else if (averagePace > 5.5) {
    speedScore -= Math.min(22, (averagePace - 5.5) * 11);
  } else if (averagePace < 2.5) {
    speedScore -= Math.min(22, (2.5 - averagePace) * 11);
  } else {
    speedScore += 8;
  }
  speedScore = clamp(Math.round(speedScore), 0, 100);

  let speedLevel: VoiceMetrics["speedLevel"] = "ideal";
  let speedComment = "話すスピードはちょうど良く、聞き取りやすいテンポです。";
  if (averagePace === 0) {
    speedLevel = "slow";
    speedComment =
      "話速の推定に十分なデータが無かったため、普段通りのテンポを意識してみましょう。";
  } else if (speedScore <= 55) {
    if (averagePace < 2.5) {
      speedLevel = "slow";
      speedComment =
        "落ち着いた話し方ですが、もう少しテンポを上げると会話が弾みやすくなります。";
    } else {
      speedLevel = "fast";
      speedComment =
        "やや早口ぎみでした。語尾まで丁寧に言い切る意識を持つと伝わりやすさが上がります。";
    }
  } else if (speedScore >= 80) {
    speedLevel = "ideal";
    speedComment =
      "テンポが安定していて、勢いと聞き取りやすさのバランスが取れています。";
  }

  const tremblingKeywordDetected = trimmedMessages.some((content) =>
    /震え|ふるえ|緊張|ガチガチ|ブルブル/.test(content)
  );
  const highFillerDensity =
    totalFillerCount > 0 &&
    totalFillerCount / userMessages.length >= 2 &&
    ellipsisCount >= userMessages.length;
  const tremblingDetected = tremblingKeywordDetected || highFillerDensity;

  let tremblingComment =
    "声の震えは特に検知されませんでした。落ち着いた発声ができています。";
  if (tremblingDetected) {
    tremblingComment =
      "緊張に由来する言い直しやフィラーが目立ちました。深呼吸をしてから話すと安定します。";
  }

  const summaryParts: string[] = [];
  if (volumeLevel === "energetic") {
    summaryParts.push("声量は十分で、自信のある印象です。");
  } else if (volumeLevel === "quiet") {
    summaryParts.push("もう少し声量を上げると伝わりやすくなります。");
  } else {
    summaryParts.push("声量はちょうど良く、落ち着いて話せています。");
  }

  if (articulationScore >= 80) {
    summaryParts.push("滑舌は明瞭で言葉がクリアに届いています。");
  } else {
    summaryParts.push("滑舌にやや課題があるため、フィラーを減らす練習をしてみましょう。");
  }

  if (speedLevel === "ideal") {
    summaryParts.push("話速も適度で、聞き取りやすいテンポです。");
  } else if (speedLevel === "slow") {
    summaryParts.push("テンポを少し上げると会話がよりスムーズになります。");
  } else {
    summaryParts.push("やや早口なので、要点ごとに区切る意識を持つと安心感が出ます。");
  }

  if (totalFillerCount > 0) {
    summaryParts.push(`フィラーは合計${totalFillerCount}回でした。減らせるとさらに自然になります。`);
  }

  return {
    volumeScore,
    volumeLevel,
    volumeComment,
    articulationScore,
    articulationComment,
    speedScore,
    speedLevel,
    speedComment,
    fillerWords: {
      totalCount: totalFillerCount,
      breakdown: fillerBreakdown.sort((a, b) => b.count - a.count),
    },
    tremblingDetected,
    tremblingComment,
    summary: summaryParts.join(" "),
  };
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
  voiceMetrics: VoiceMetrics;
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
- 実戦的な会話スキルの向上を重視してください
- **良かった点と改善点は、それぞれ優先度の高いものから順に最大3個まで**に絞ってください
- 改善点は、改善すべき優先度が高い順（影響度が大きい順）に並べてください`;

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
  const voiceMetrics = calculateVoiceMetrics(messages);

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
    voiceMetrics,
  };
}
