// API型定義

// Voice型定義
export interface Voice {
	voice_id: string;
	name: string;
	category?: string;
	description?: string;
	preview_url?: string;
	labels?: Record<string, string>;
}

// APIレスポンス型定義
export interface HealthResponse {
	status: string;
}

export interface VoicesResponse {
	voices: Voice[];
}

export interface VoiceResponse {
	voice: Voice;
}

export interface SpeechToTextResponse {
	text: string;
	voice?: Voice;
}

export interface ErrorResponse {
	error: string;
}

// API リクエスト型定義
export interface SpeechToTextRequest {
	audio: File;
	voiceId?: string;
}

// フィードバック型定義
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
		breakdown: {
			word: string;
			count: number;
		}[];
	};
	tremblingDetected: boolean;
	tremblingComment: string;
	summary: string;
}

export interface Feedback {
	id: string;
	goodPoints: string;
	improvementPoints: string;
	overallScore: number | null;
	conversationScore?: number | null;
	gestureScore?: number | null;
	voiceScore?: number | null;
	conversationId: string;
	createdAt: string;
	updatedAt: string;
	gestureGoodPoints?: string | null;
	gestureImprovementPoints?: string | null;
	voiceMetrics?: VoiceMetrics | null;
}

// 会話履歴型定義
export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	audioUrl: string | null;
	conversationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface ConversationSession {
	id: string;
	userId?: string | null;
	status: "active" | "completed";
	createdAt: string;
	updatedAt: string;
	messages?: Message[];
	feedback?: Feedback;
	gestures?: GestureMetrics;
}

// API レスポンス型定義（セッション）
export interface CreateSessionResponse {
	session: ConversationSession;
}

export interface GetSessionResponse {
	session: ConversationSession;
}

export interface GetSessionsResponse {
	sessions: ConversationSession[];
}

// API レスポンス型定義（メッセージ）
export interface CreateMessageRequest {
	role: "user" | "assistant";
	content: string;
	audioUrl?: string;
}

export interface CreateMessageResponse {
	message: Message;
}

// API レスポンス型定義（フィードバック）
export interface CreateFeedbackRequest {
	goodPoints: string;
	improvementPoints: string;
	overallScore?: number;
}

export interface CreateFeedbackResponse {
	feedback: Feedback;
}

// API レスポンス型定義（会話生成）
export interface GenerateConversationRequest {
	sessionId: string;
	userMessage: string;
	systemPrompt?: string;
	avatarId?: string; // backend persona id (e.g. maki, rento, kouta)
	relationshipStage?: "shy" | "friendly" | "open"; // 会話の親密度段階
}

export interface GenerateConversationResponse {
	response: string;
	emotion: "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful";
	userMessage: Message;
	assistantMessage: Message;
}

// API レスポンス型定義（フィードバック生成）
export interface GenerateFeedbackRequest {
	sessionId: string;
}

export interface GenerateFeedbackResponse {
	feedback: Feedback;
}

export interface GestureMetrics {
	id: string;
	conversationId: string;
	totalSamples: number;
	smilingSamples: number;
	smileIntensityAvg: number;
	smileIntensityMax: number;
	gazeScoreAvg: number;
	lookingSamples: number;
	gazeUpSamples: number;
	gazeDownSamples: number;
	createdAt: string;
	updatedAt: string;
}

export interface SaveGestureMetricsRequest {
	totalSamples: number;
	smilingSamples: number;
	smileIntensityAvg: number;
	smileIntensityMax: number;
	gazeScoreAvg: number;
	lookingSamples: number;
	gazeUpSamples: number;
	gazeDownSamples: number;
}

export interface SaveGestureMetricsResponse {
	metrics: GestureMetrics;
}
