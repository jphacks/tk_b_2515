import { apiClient } from "./client";
import type {
	SaveGestureMetricsRequest,
	SaveGestureMetricsResponse,
} from "@/types/api";

export const gestureApi = {
	async saveMetrics(
		sessionId: string,
		data: SaveGestureMetricsRequest,
	): Promise<SaveGestureMetricsResponse> {
		return apiClient.post<SaveGestureMetricsResponse>(
			`/sessions/${sessionId}/gestures`,
			data,
		);
	},
};
