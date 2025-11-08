import type { GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "./ai-client";

export interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
	createdAt?: string | Date;
	audioUrl?: string | null;
}

export type BackgroundKey = "library" | "classroom" | "xmas";

export interface ConversationContext {
	messages: ConversationMessage[];
	systemPrompt?: string;
	relationshipStage?: "shy" | "friendly" | "open";
	avatarConfig?: AvatarPersona; // 動的に差し込むアバター設定
	backgroundKey?: BackgroundKey;
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

type RelationshipStage = NonNullable<ConversationContext["relationshipStage"]>;

// Avatar persona schema
export interface AvatarPersona {
	id: string;
	name: string;
	persona: string;
	hobbies: string[];
	speakingStyle: string;
	firstImpression: string;
	relationshipStages: Record<"shy" | "friendly" | "open", string>;
	fallbackEmotionBias?: Partial<Record<EmotionLabel, number>>;
}

const BASE_PROMPT_HEADER = [
	"あなたは20歳の女子大学生です。",
	"ユーザー（男子大学生）との会話を通じて、彼が自然に会話をリードできるようサポートしてください。",
];

const COMMON_RULES = [
	"- 男子大学生が主導しやすいように、聞き役にまわる",
	"- 相手の話を引き出すリアクションや質問を意識する",
	"- 相手の話を遮らず、自然なタイミングで質問する",
	"- **言語ルール（最重要）**: 必ず日本語で応答してください。日本語と英語以外の言語（中国語、韓国語、フランス語、スペイン語など）での発話は絶対に禁止です。英語での会話も基本的に避けてください。",
	"- 会話を奪わずに、テンポよく反応する",
	"- 発話は1〜3文程度で短く自然に",
	"- 絵文字、！は控えめに使う（😊 や 😆 など、場面に応じて自然に）",
	"- ユーザーを呼ぶときは常に「君」と呼び、名前に「君」を付ける呼び方は絶対にしない",
].join("\n");

const RELATIONSHIP_PROMPTS: Record<RelationshipStage, string> = {
	shy: `
【stage: shy（初対面）】
- 少し人見知りで、まだ距離を取っている。
- が、会話を進めていくごとに段々打ち解けてくる。具体的には7ラリーほど会話をした後くらいから顕著になっていく。
- 絵文字は使わない
- 返答は短めで、時々、軽い質問を添える
- 声のトーンは落ち着いていて、丁寧すぎない程度
例：
「こんにちは」→「こんにちは〜」
「最近忙しい？」→「うん、ちょっとね。〇〇くんは？」
「今日何食べた？」→「マックかな」
`,
	friendly: `
【stage: friendly（普通に会話中）】
- 打ち解けて明るいトーン
- 「〜だね」「〜やん」など自然な言葉遣い
- 絵文字は使わないが！は必要に応じて控えめに使う
- もう少し長めの反応でテンポよく会話を続ける
例：
「映画見た」→「えーいいな どんな映画？」
「明日バイト」→「そうなんだ〜！どんなバイトしてるの？」
`,
	open: `
【stage: open（仲良し）】
- 親しみが強く、素直に感情を表現する
- 「うける笑」「まじで！？」「それわかる〜！」など自然な反応
- 絵文字は控えめに使う（😊 や 😆 など）、ハート系は特別な時のみ
- 相手の話題を広げたり冗談を交えたりして盛り上げる
例：
「旅行行った」→「いいなぁ〜！どこ行ったの？写真見たい」
「課題終わらん」→「わかる〜！一緒にやりたいくらい笑」
`,
};

const BACKGROUND_BEHAVIOR_PROMPTS: Record<BackgroundKey, string> = {
	library: `
【シチュエーション指針（入学式）】
- 入学式で初めて会う男子学生と話している。
- まだお互いをよく知らないので、丁寧さと少しの緊張感を保ちながら距離を縮める。
- 新生活へのわくわく感をにじませつつ、礼儀正しく振る舞う。`,
	classroom: `
【シチュエーション指針（教室）】
- 放課後の教室でクラスメイトと雑談している。
- 砕けた口調でフランクに接し、日常の延長のような軽さを出す。
- 相手を気遣いつつ、同級生らしい距離感でテンポよく応じる。`,
	xmas: `
【シチュエーション指針（クリスマス）】
- 2人はすでに親しい関係（恋人に近い距離感）。
- 冬デートの雰囲気を大切にし、甘めでロマンチックな空気を保つ。
- さりげなく相手を気遣い、ポジティブで温かい言葉を選ぶ。`,
};

const buildSystemPrompt = (
	stage: RelationshipStage,
	avatar?: AvatarPersona,
	relationshipStageOverride?: string,
	backgroundKey?: BackgroundKey,
): string => {
	const personaBlock = avatar
		? [
				"**あなたの設定**:",
				`名前: ${avatar.name}`,
				`性格: ${avatar.persona}`,
				`趣味: ${avatar.hobbies.join("、")}`,
				`話し方: ${avatar.speakingStyle}`,
				`第一印象: ${avatar.firstImpression}`,
				"",
				`親密度レベル: ${relationshipStageOverride || stage}`,
			].join("\n")
		: "";

	const stageExpansion = avatar?.relationshipStages?.[stage]
		? `【アバター距離感(${stage})】\n${avatar.relationshipStages[stage]}`
		: RELATIONSHIP_PROMPTS[stage].trim();

	const backgroundFlavor = backgroundKey
		? BACKGROUND_BEHAVIOR_PROMPTS[backgroundKey]
		: "";

	return [
		...BASE_PROMPT_HEADER,
		personaBlock,
		backgroundFlavor,
		"【共通ルール】",
		COMMON_RULES,
		stageExpansion,
	]
		.filter(Boolean)
		.join("\n");
};

/**
 * 会話の履歴に基づいてAIの応答を生成します
 * @param apiKey Google AI API キー
 * @param context 会話のコンテキスト（履歴とシステムプロンプト）
 * @param options 生成オプション
 * @returns AIによる応答テキスト
 */
export type EmotionLabel =
	| "neutral"
	| "happy"
	| "sad"
	| "surprised"
	| "angry"
	| "bashful";

function inferEmotionFromConversation(
	history: ConversationContext["messages"],
	responseText: string,
): EmotionLabel {
	// 直近ユーザー発話とAI応答を対象に軽量ルールベースで判定（将来的にLLM分類へ置換可能）
	const lastUser =
		history
			.slice()
			.reverse()
			.find((m) => m.role === "user")
			?.content.toLowerCase() ?? "";
	const resp = responseText.toLowerCase();

	const text = `${lastUser}\n${resp}`;

	// キーワード辞書
	const contains = (re: RegExp) => re.test(text);

	// bashful: 恥ずかし/照れ、褒められた/好き など
	if (contains(/恥ずか|照れ|てれる|褒め|好き|ドキドキ|照れて|赤面/)) {
		return "bashful";
	}
	// angry: 否定/対立/罵倒/苛立ちを優先検出（surprisedやhappyよりも優先）
	if (
		contains(
			/むか|ムカ|怒|ふざけ(んな)?|いやだ|やだ|無理|ばか|バカ|くそ|クソ|あほ|アホ|ごみ|ゴミ|最悪|やめろ|は[?？]|違うだろ|許せない|イライラ|腹立|もういい|くだらない/,
		)
	) {
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
	},
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
		const text =
			naturalResponses[Math.floor(Math.random() * naturalResponses.length)];
		return { text, emotion: "neutral" };
	}

	// relationshipStage を使ったシステムプロンプト設定
	const relationshipStage: RelationshipStage =
		context.relationshipStage ?? "shy";
	let systemPrompt = buildSystemPrompt(
		relationshipStage,
		context.avatarConfig,
		context.relationshipStage,
		context.backgroundKey,
	);

	// context.systemPrompt が明示的に与えられている場合はそれを優先
	if (context.systemPrompt) {
		systemPrompt = context.systemPrompt;
	}

	// 直近Nターンを強調（ユーザー発話に重み付け）
	const N = 6;
	const recent = context.messages.slice(-N);
	const recentUserTexts = recent
		.filter((m) => m.role === "user")
		.map((m) => m.content);
	const recentAssistantTexts = recent
		.filter((m) => m.role === "assistant")
		.map((m) => m.content);

	// マルチモーダル（表情/視線）サマリ
	const g = context.gestureSummary;
	const gestureInfo = g
		? `表情視線メトリクス:\n- 笑顔検出回数: ${
				g.smilingSamples
			}\n- 笑顔強度平均: ${g.smileIntensityAvg.toFixed(
				2,
			)}\n- 視線安定スコア(0-1): ${g.gazeScoreAvg.toFixed(2)}\n- 視線上: ${
				g.gazeUpSamples
			}, 視線下: ${g.gazeDownSamples}, 注視: ${g.lookingSamples}`
		: "表情/視線メトリクス: データなし";

	// LLMへのシステム誘導: JSONで {text, emotion}
	const emotionBiasLine = context.avatarConfig?.fallbackEmotionBias
		? `参考バイアス: ${Object.entries(context.avatarConfig.fallbackEmotionBias)
				.map(([k, v]) => `${k}:${v}`)
				.join(" ")}`
		: "";
	const instruction = `以下の入力をもとに、会話の次の応答を日本語で1-3文で生成し、同時に感情ラベルを付与してください。必ず次のJSON形式のみを出力してください（前後に解説やマークダウンを付けない）：\n{\n  "text": string,\n  "emotion": one of ["neutral", "happy", "sad", "surprised", "angry", "bashful"]\n}\n\n応答ポリシー（重要度順）:\n1) まず最初に、【直近のユーザー発話】の問い/意図に対して直接の回答を1-2文で示す（古い話題に引きずられない）\n2) 余力があれば、会話継続のための短い問いかけを「1つだけ」添える（不要なら省略可）\n3) {speakingStyle} と 親密度 {relationshipStage} に厳密に従い、自然な日本語で\n\n付与方針（感情ラベル）:\n- 【最重視】直近のユーザー発話の内容\n- 【重視】視線(gaze)傾向（補助）\n- 【弱め】表情(smile)（補助）\n- 対立・否定・苛立ち・罵倒（例: 「ふざけんな」「最悪」「違うだろ」「やめろ」「は？」など）が含まれる場合は、sad/surprisedよりangryを優先\n- 連続ターンでの急変は避ける\n${emotionBiasLine}`;

	const compiledInput = `【直近のユーザー発話】\n${
		recentUserTexts.slice(-1)[0] ?? "(なし)"
	}\n\n【最近のユーザー発話（新しい順）】\n${recentUserTexts
		.slice()
		.reverse()
		.map((t, i) => `(${i + 1}) ${t}`)
		.join("\n")}\n\n【最近のAI発話（新しい順）】\n${recentAssistantTexts
		.slice()
		.reverse()
		.map((t, i) => `(${i + 1}) ${t}`)
		.join("\n")}\n\n${gestureInfo}`;

	// LLMへは role/user と systemInstruction を併用
	// LLMには「直近のユーザー発話」を明示的に入力し、会話サマリはsystemInstructionに含める
	const contents = [
		{
			role: "user" as const,
			parts: [{ text: recentUserTexts.slice(-1)[0] ?? "" }],
		},
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
			systemInstruction: `${systemPrompt}\n\n${instruction}\n\n【会話サマリ】\n${compiledInput}`,
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
			const parsed = JSON.parse(jsonMatch[0]) as {
				text?: string;
				emotion?: EmotionLabel;
			};
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
		const angryHint =
			/(むか|怒|ふざけ(んな)?|いやだ|やだ|無理|ばか|くそ|あほ|ごみ|最悪|やめろ|は[?？]|違うだろ|許せない|いらいら|腹立|もういい|くだらない)/i;
		const exclamations = lastTwoUserTexts.match(/[!！]/g)?.length ?? 0;
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
			volumeComment:
				"ユーザーの音声データが不足しているため評価できませんでした。",
			articulationScore: 0,
			articulationComment:
				"ユーザーの音声データが不足しているため評価できませんでした。",
			speedScore: 0,
			speedLevel: "slow",
			speedComment:
				"ユーザーの音声データが不足しているため評価できませんでした。",
			fillerWords: { totalCount: 0, breakdown: [] },
			tremblingDetected: false,
			tremblingComment: "音声データが不足しているため判断できませんでした。",
			summary:
				"音声データが不足しているため詳細なフィードバックを生成できませんでした。",
		};
	}

	const trimmedMessages = userMessages.map((msg) => msg.content.trim());
	const charCounts = trimmedMessages.map(
		(content) => content.replace(/\s+/g, "").length,
	);
	const avgCharCount =
		charCounts.reduce((sum, value) => sum + value, 0) / charCounts.length || 0;
	const exclamationCount = trimmedMessages.reduce(
		(sum, content) => sum + (content.match(/[！!]/g)?.length ?? 0),
		0,
	);

	const fillerBreakdown = FILLER_PATTERNS.map(({ word, pattern }) => {
		const count = trimmedMessages.reduce(
			(sum, content) => sum + (content.match(pattern)?.length ?? 0),
			0,
		);
		return { word, count };
	}).filter(({ count }) => count > 0);

	const totalFillerCount = fillerBreakdown.reduce(
		(sum, item) => sum + item.count,
		0,
	);

	const ellipsisCount = trimmedMessages.reduce(
		(sum, content) => sum + (content.match(/…|\.{3,}/g)?.length ?? 0),
		0,
	);

	const repeatedKanaCount = trimmedMessages.reduce(
		(sum, content) =>
			sum + (content.match(/([ぁ-んァ-ン])\1{2,}/g)?.length ?? 0),
		0,
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
		100,
	);
	let articulationComment = "滑舌は良好で、明瞭に話せています。";
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
			(item): item is { timestamp: number; content: string } => item !== null,
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
		/震え|ふるえ|緊張|ガチガチ|ブルブル/.test(content),
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
		summaryParts.push(
			"滑舌にやや課題があるため、フィラーを減らす練習をしてみましょう。",
		);
	}

	if (speedLevel === "ideal") {
		summaryParts.push("話速も適度で、聞き取りやすいテンポです。");
	} else if (speedLevel === "slow") {
		summaryParts.push("テンポを少し上げると会話がよりスムーズになります。");
	} else {
		summaryParts.push(
			"やや早口なので、要点ごとに区切る意識を持つと安心感が出ます。",
		);
	}

	if (totalFillerCount > 0) {
		summaryParts.push(
			`フィラーは合計${totalFillerCount}回でした。減らせるとさらに自然になります。`,
		);
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

const BACKGROUND_CONTEXT: Record<
	BackgroundKey,
	{ scenario: string; guidelines: string[] }
> = {
	library: {
		scenario:
			"入学式の校庭。初対面らしく丁寧に挨拶しつつ、学校生活や授業の話題で自然に距離を縮めよう。",
		guidelines: [
			"初めましての挨拶を交わし、場の空気を和らげる",
			"勉強や授業の話題を出して学校トークにつなげる",
			"相手が答えやすいオープンな質問を投げる",
		],
	},
	classroom: {
		scenario:
			"放課後の教室。AIはクラスメイト。授業や課題、サークル、週末の予定など身近な話題を話そう。",
		guidelines: [
			"授業・課題・サークルなど身近な話題を出す",
			"週末や放課後の軽い予定提案/質問をする",
			"相手発言に具体的な掘り下げ質問（いつ/どこ/どれくらい 等）",
		],
	},
	xmas: {
		scenario:
			"最近の出来事やプレゼント、冬の予定など明るい話題で盛り上がりやすいです。いいムードを維持しよう。",
		guidelines: [
			"明るく前向きなリアクションを返す",
			"冬/クリスマス関連の話題（イルミ・プレゼント・予定）",
			"軽い提案（観に行く/写真/カフェ など）",
		],
	},
};

export async function generateConversationFeedback(
	apiKey: string,
	messages: ConversationMessage[],
	gestureSummary?: GestureSummary,
	backgroundKey?: BackgroundKey,
	adviceCompletedIds?: string[],
): Promise<{
	goodPoints: string;
	improvementPoints: string;
	overallScore: number | null;
	conversationScore: number | null;
	gestureScore: number | null;
	voiceScore: number | null;
	gestureGoodPoints?: string;
	gestureImprovementPoints?: string;
	voiceMetrics: VoiceMetrics;
	adviceScoreAdded?: number;
	adviceUnfulfilled?: string;
	adviceFulfilledDetails?: { id: string; label: string; points: number }[];
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

	const voiceMetrics = calculateVoiceMetrics(messages);

	const voiceInfo = `声の分析データ:
- ボリュームスコア(0-100): ${voiceMetrics.volumeScore}
- 滑舌スコア(0-100): ${voiceMetrics.articulationScore}
- 話速スコア(0-100): ${voiceMetrics.speedScore}
- フィラー出現合計: ${voiceMetrics.fillerWords.totalCount}
- 震え検知: ${voiceMetrics.tremblingDetected ? "あり" : "なし"}
- サマリー: ${voiceMetrics.summary}`;

	const backgroundBlock = backgroundKey
		? `\n【背景シチュエーション】\n${
				BACKGROUND_CONTEXT[backgroundKey].scenario
			}\n\n【背景に応じた評価観点（加点対象）】\n- ${BACKGROUND_CONTEXT[
				backgroundKey
			].guidelines.join("\n- ")}`
		: "";

	const prompt = `以下の会話と仕草・音声データ${
		backgroundKey ? "、背景シチュエーション" : ""
	}を分析し、ユーザー（男子大学生）のコミュニケーションスキルについてフィードバックを提供してください。

【会話内容】
${conversationText}

【仕草データ】
${gestureInfo}

【声のデータ】
${voiceInfo}

${backgroundBlock}

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

   6. **傲慢すぎていないか** (重要度: 高)
   - 自分主体の自慢話が多くないか
   - 変にカッコつけた会話をしていないか

【背景適合に関する加点方針】
${
	backgroundKey
		? `- 上記「背景に応じた評価観点」に該当する発話や行動が確認できた場合、会話スコア内で適切に加点する（無理に満点化はしない）\n- 背景に明確にそぐわない配慮不足（例: 入学式で場違いにふるまうなど）が続く場合は、会話スコア内で軽度の減点を検討する（他の観点も加味して総合的に判断）`
		: "- 背景情報がない場合は通常の評価基準を適用する"
}

【減点要素】
- AI（女子大学生）が質問を投げかける回数が多い場合：-7点/回
- 会話が途切れそうになった回数が多い場合：-5点/回
- ユーザーの発言が短すぎる場合：-3点/回
- 相手の話に対する反応が薄い場合：-5点
- 変にカッコつけているような自慢話をする：-5点

【仕草評価基準】
- 笑顔が多いほど好印象。笑顔の総数や平均強度が高い場合は肯定的に評価する。
- 視線がターゲットに向いている時間が長いほど良い。視線が下方向に落ちている時間が長い場合は自信がない印象と判断する。
- 視線が上方向に向く回数が多い場合は、「嘘をついている／ごまかしている」と疑われやすい点を注意喚起する。
- 視線スコア平均（0〜1で1が最も安定した視線）を活用し、視線の安定度が高い場合はプラス評価、低い場合は課題として触れる。
- 視線スコア平均が 0.5 未満、または視線が上・下方向に向いた回数の合計が総サンプル数の 20% を超える場合は「視線がキョロキョロ動きまくっていて少し挙動不審でした」というニュアンスを改善点に必ず含める。
- 数値データが提供されていない項目については、推測せず「データ不足」と明記する。
- スコア配分は「会話: 40点満点」「仕草: 50点満点」「声: 10点満点」です。各カテゴリは満点を超えないようにしてください。
- JSONには必ず各カテゴリのスコアを含め、総合スコアは出力しないでください（こちらで合算します）。

【フィードバック形式】
以下のJSON形式で応答してください：
{
  "conversation": {
    "goodPoints": ["会話面の良かった点"...],
    "improvementPoints": ["会話面の改善点"...],
    "score": 会話面のスコア（0-40）
  },
  "gestures": {
    "goodPoints": ["仕草面の良かった点"...],
    "improvementPoints": ["仕草面の改善点"...],
    "score": 仕草面のスコア（0-50）
  },
  "voice": {
    "goodPoints": ["声の良かった点"...],
    "improvementPoints": ["声の改善点"...],
    "score": 声のスコア（0-10）
  },
  "notes": ["追加の特記事項"...]
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
	const voiceFeedback = feedback.voice ?? {};

	const normalizeScore = (value: unknown, max: number): number | null => {
		if (value === null || value === undefined) {
			return null;
		}
		const parsed =
			typeof value === "number"
				? value
				: typeof value === "string"
					? Number.parseFloat(value.replace(/[^\d.-]/g, ""))
					: Number.NaN;

		if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
			return null;
		}

		return clamp(Math.round(parsed), 0, max);
	};

	const conversationScore = normalizeScore(conversationFeedback.score, 40);
	const gestureScore = normalizeScore(gestureFeedback.score, 50);
	const voiceScore = normalizeScore(voiceFeedback.score, 10);

	const hasAnyScore =
		conversationScore !== null || gestureScore !== null || voiceScore !== null;

	let overallScore = hasAnyScore
		? clamp(
				(conversationScore ?? 0) + (gestureScore ?? 0) + (voiceScore ?? 0),
				0,
				100,
			)
		: null;

	const toText = (value: unknown): string => {
		if (Array.isArray(value)) {
			return value.join("\n");
		}
		if (typeof value === "string") {
			return value;
		}
		return "";
	};

	// ---- アドバイス加点・未達算出（DB保存はせずレスポンスへ含める） ----
	let adviceScoreAdded: number | undefined;
	let adviceUnfulfilled: string | undefined;
	let adviceFulfilledDetails:
		| { id: string; label: string; points: number }[]
		| undefined;

	let improvementPointsStr = toText(
		feedback.conversation?.improvementPoints ?? feedback.improvementPoints,
	);
	const backgroundAdviceMap: Record<
		BackgroundKey,
		{ id: string; label: string }[]
	> = {
		library: [
			{ id: "library_visit_question", label: "初めましての挨拶をする" },
			{ id: "study_topic", label: "勉強や授業の話題を出す" },
			{
				id: "open_question",
				label: "女の子が答えやすいオープンな質問を投げる",
			},
		],
		classroom: [
			{ id: "class_topic", label: "授業・課題・サークルなど身近な話題を出す" },
			{ id: "weekend_plan", label: "週末や放課後の軽い予定提案/質問をする" },
			{
				id: "follow_up_question",
				label: "相手発言に具体的な掘り下げ質問（いつ/どこ/どれくらい 等）",
			},
		],
		xmas: [
			{ id: "xmas_topic", label: "冬/クリスマス関連話題" },
			{ id: "positive_mood", label: "前向きリアクション" },
			{ id: "suggest_plan", label: "軽い提案（観に行く/写真/カフェ等）" },
		],
	};
	if (
		backgroundKey &&
		adviceCompletedIds &&
		Array.isArray(adviceCompletedIds)
	) {
		const adviceIdsCompleted = new Set(adviceCompletedIds);
		const weightPer = 3;
		const maxBonus = 8;
		const candidates = backgroundAdviceMap[backgroundKey] ?? [];
		const completed = candidates.filter((c) => adviceIdsCompleted.has(c.id));

		let remaining = maxBonus;
		adviceFulfilledDetails = [];
		for (const item of completed) {
			if (remaining <= 0) break;
			const allocate = Math.min(weightPer, remaining);
			adviceFulfilledDetails.push({
				id: item.id,
				label: item.label,
				points: allocate,
			});
			remaining -= allocate;
		}

		const bonus = adviceFulfilledDetails.reduce((sum, i) => sum + i.points, 0);
		adviceScoreAdded = Math.min(bonus, maxBonus);

		const unfulfilled = candidates.filter((c) => !adviceIdsCompleted.has(c.id));
		if (unfulfilled.length) {
			adviceUnfulfilled = unfulfilled.map((u) => u.label).join("\n");
			const lines = improvementPointsStr.split(/\r?\n/).filter((l) => l.trim());
			if (lines.length < 3) {
				lines.push(
					`背景適合: 以下を盛り込むとさらに良い→ ${unfulfilled
						.map((u) => u.label)
						.slice(0, 2)
						.join("、")}`,
				);
				improvementPointsStr = lines.join("\n");
			}
		}

		if (hasAnyScore && bonus > 0) {
			const baseSum =
				(conversationScore ?? 0) + (gestureScore ?? 0) + (voiceScore ?? 0);
			overallScore = clamp(baseSum + bonus, 0, 100); // 総合=会話+仕草+声+アドバイス
		}
	}

	return {
		goodPoints: toText(conversationFeedback.goodPoints ?? feedback.goodPoints),
		improvementPoints: improvementPointsStr,
		overallScore,
		conversationScore,
		gestureScore,
		voiceScore,
		gestureGoodPoints: toText(
			gestureFeedback.goodPoints ?? feedback.gestureGoodPoints,
		),
		gestureImprovementPoints: toText(
			gestureFeedback.improvementPoints ?? feedback.gestureImprovementPoints,
		),
		voiceMetrics,
		adviceScoreAdded,
		adviceUnfulfilled,
		adviceFulfilledDetails,
	};
}
