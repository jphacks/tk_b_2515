import type {
	SaveGestureMetricsRequest,
	SaveGestureMetricsResponse,
} from "@/types/api";
import { apiClient } from "./client";

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
