import { apiClient } from "./client";
import type {
	CreateFeedbackRequest,
	CreateFeedbackResponse,
	GenerateFeedbackRequest,
	GenerateFeedbackResponse,
} from "@/types/api";

/**
 * フィードバックAPI
 */
export const feedbackApi = {
	/**
	 * セッションに手動でフィードバックを追加
	 */
	async createFeedback(
		sessionId: string,
		data: CreateFeedbackRequest,
	): Promise<CreateFeedbackResponse> {
		return apiClient.post<CreateFeedbackResponse>(
			`/sessions/${sessionId}/feedback`,
			data,
		);
	},

	/**
	 * AIによってフィードバックを生成
	 */
	async generateFeedback(
		data: GenerateFeedbackRequest,
	): Promise<GenerateFeedbackResponse> {
		return apiClient.post<GenerateFeedbackResponse>(
			"/conversation/feedback",
			data,
		);
	},
};
