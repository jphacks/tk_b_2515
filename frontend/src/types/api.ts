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
	id: string;
	goodPoints: string;
	improvementPoints: string;
	overallScore: number | null;
	conversationId: string;
	createdAt: string;
	updatedAt: string;
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
	status: "active" | "completed";
	createdAt: string;
	updatedAt: string;
	messages?: Message[];
	feedback?: Feedback;
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
}

export interface GenerateConversationResponse {
	response: string;
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
