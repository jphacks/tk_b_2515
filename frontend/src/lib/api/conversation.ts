import { apiClient } from "./client";
import type {
	ConversationSession,
	CreateSessionResponse,
	GetSessionResponse,
	GetSessionsResponse,
	CreateMessageRequest,
	CreateMessageResponse,
	GenerateConversationRequest,
	GenerateConversationResponse,
} from "@/types/api";

/**
 * セッション管理API
 */
export const sessionApi = {
	/**
	 * 新しい会話セッションを作成
	 */
	async createSession(): Promise<ConversationSession> {
		const response = await apiClient.post<CreateSessionResponse>(
			"/sessions",
			{},
		);
		return response.session;
	},

	/**
	 * すべての会話セッションを取得
	 */
	async getSessions(): Promise<ConversationSession[]> {
		const response =
			await apiClient.get<GetSessionsResponse>("/sessions");
		return response.sessions;
	},

	/**
	 * 特定の会話セッションを取得
	 */
	async getSession(sessionId: string): Promise<ConversationSession> {
		const response = await apiClient.get<GetSessionResponse>(
			`/sessions/${sessionId}`,
		);
		return response.session;
	},

	/**
	 * セッションを終了
	 */
	async finishSession(sessionId: string): Promise<ConversationSession> {
		const response = await apiClient.patch<CreateSessionResponse>(
			`/sessions/${sessionId}/finish`,
			{},
		);
		return response.session;
	},
};

/**
 * メッセージ管理API
 */
export const messageApi = {
	/**
	 * セッションに新しいメッセージを追加
	 */
	async createMessage(
		sessionId: string,
		data: CreateMessageRequest,
	): Promise<CreateMessageResponse> {
		return apiClient.post<CreateMessageResponse>(
			`/sessions/${sessionId}/messages`,
			data,
		);
	},
};

/**
 * 会話生成API
 */
export const conversationApi = {
	/**
	 * AI応答を生成して会話を進める
	 */
	async generateResponse(
		data: GenerateConversationRequest,
	): Promise<GenerateConversationResponse> {
		return apiClient.post<GenerateConversationResponse>(
			"/conversation/generate",
			data,
		);
	},
};
