"use client";

import { useCallback, useRef } from "react";
import { textToSpeechUrl } from "@/lib/api/tts";

interface PreloadEntry {
	text: string;
	voiceId: string;
	promise: Promise<string>;
}

/**
 * 音声のプリロード管理フック
 * 次に発話される可能性のある応答を事前に生成
 */
export function useAudioPreload() {
	const preloadQueue = useRef<Map<string, PreloadEntry>>(new Map());

	/**
	 * 音声をプリロード
	 */
	const preloadAudio = useCallback(
		async (text: string, voiceId: string): Promise<void> => {
			const key = `${voiceId}:${text}`;

			// 既にプリロード中の場合はスキップ
			if (preloadQueue.current.has(key)) {
				return;
			}

			// プリロードを開始
			const promise = textToSpeechUrl(
				{ text, voiceId },
				{ useCache: true, fallbackToSilence: false },
			);

			preloadQueue.current.set(key, {
				text,
				voiceId,
				promise,
			});

			try {
				await promise;
				console.log("Preloaded audio for:", text.substring(0, 50));
			} catch (error) {
				console.error("Failed to preload audio:", error);
				// エラーの場合はキューから削除
				preloadQueue.current.delete(key);
			}
		},
		[],
	);

	/**
	 * 複数の音声をプリロード
	 */
	const preloadMultiple = useCallback(
		async (items: Array<{ text: string; voiceId: string }>): Promise<void> => {
			const promises = items.map(({ text, voiceId }) =>
				preloadAudio(text, voiceId),
			);
			await Promise.allSettled(promises);
		},
		[preloadAudio],
	);

	/**
	 * プリロードキューをクリア
	 */
	const clearPreloadQueue = useCallback(() => {
		preloadQueue.current.clear();
	}, []);

	/**
	 * プリロード済みかチェック
	 */
	const isPreloaded = useCallback((text: string, voiceId: string): boolean => {
		const key = `${voiceId}:${text}`;
		return preloadQueue.current.has(key);
	}, []);

	return {
		preloadAudio,
		preloadMultiple,
		clearPreloadQueue,
		isPreloaded,
	};
}
