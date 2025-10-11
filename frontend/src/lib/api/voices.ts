import type {
	HealthResponse,
	VoiceResponse,
	VoicesResponse,
} from "@/types/api";
import { apiClient } from "./client";

/**
 * ヘルスチェック
 */
export async function checkHealth(): Promise<HealthResponse> {
	return apiClient.get<HealthResponse>("/api/health");
}

/**
 * 利用可能な音声一覧を取得
 */
export async function getVoices(): Promise<VoicesResponse> {
	return apiClient.get<VoicesResponse>("/api/voices");
}

/**
 * 特定の音声情報を取得
 */
export async function getVoiceById(voiceId: string): Promise<VoiceResponse> {
	return apiClient.get<VoiceResponse>(`/api/voices/${voiceId}`);
}
