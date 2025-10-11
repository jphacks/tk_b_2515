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
export interface Feedback {
	goodPoints: string[];
	improvements: string[];
	overallScore: number;
}

// 会話履歴型定義
export interface ConversationMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

export interface ConversationSession {
	id: string;
	startTime: Date;
	endTime?: Date;
	messages: ConversationMessage[];
	feedback?: Feedback;
}
