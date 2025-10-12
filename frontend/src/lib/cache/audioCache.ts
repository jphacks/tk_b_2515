/**
 * 音声キャッシュ管理
 * 同じテキストの音声を再利用することで、API呼び出しを削減
 */

interface CacheEntry {
	audioUrl: string;
	timestamp: number;
	voiceId: string;
	text: string;
}

class AudioCache {
	private cache: Map<string, CacheEntry>;
	private maxSize: number;
	private maxAge: number; // ミリ秒

	constructor(maxSize = 50, maxAgeMinutes = 60) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.maxAge = maxAgeMinutes * 60 * 1000;
	}

	/**
	 * キャッシュキーを生成
	 */
	private generateKey(text: string, voiceId: string): string {
		// テキストとvoiceIdからハッシュ化されたキーを生成
		return `${voiceId}:${text}`;
	}

	/**
	 * キャッシュから音声を取得
	 */
	get(text: string, voiceId: string): string | null {
		const key = this.generateKey(text, voiceId);
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		// 有効期限チェック
		const now = Date.now();
		if (now - entry.timestamp > this.maxAge) {
			// 期限切れのエントリを削除
			this.delete(text, voiceId);
			return null;
		}

		// ヒット時にタイムスタンプを更新（LRU的な挙動）
		entry.timestamp = now;
		return entry.audioUrl;
	}

	/**
	 * キャッシュに音声を保存
	 */
	set(text: string, voiceId: string, audioUrl: string): void {
		// キャッシュサイズ制限チェック
		if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		const key = this.generateKey(text, voiceId);
		this.cache.set(key, {
			audioUrl,
			timestamp: Date.now(),
			voiceId,
			text,
		});
	}

	/**
	 * キャッシュから削除
	 */
	delete(text: string, voiceId: string): void {
		const key = this.generateKey(text, voiceId);
		const entry = this.cache.get(key);

		if (entry) {
			// URLをクリーンアップ
			URL.revokeObjectURL(entry.audioUrl);
			this.cache.delete(key);
		}
	}

	/**
	 * 最も古いエントリを削除
	 */
	private evictOldest(): void {
		let oldestKey: string | null = null;
		let oldestTimestamp = Number.MAX_VALUE;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTimestamp) {
				oldestTimestamp = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			const entry = this.cache.get(oldestKey);
			if (entry) {
				URL.revokeObjectURL(entry.audioUrl);
			}
			this.cache.delete(oldestKey);
		}
	}

	/**
	 * キャッシュをクリア
	 */
	clear(): void {
		// すべてのURLをクリーンアップ
		for (const entry of this.cache.values()) {
			URL.revokeObjectURL(entry.audioUrl);
		}
		this.cache.clear();
	}

	/**
	 * キャッシュサイズを取得
	 */
	size(): number {
		return this.cache.size;
	}

	/**
	 * 期限切れのエントリを削除
	 */
	cleanup(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.maxAge) {
				keysToDelete.push(key);
			}
		}

		for (const key of keysToDelete) {
			const entry = this.cache.get(key);
			if (entry) {
				URL.revokeObjectURL(entry.audioUrl);
			}
			this.cache.delete(key);
		}
	}
}

// グローバルキャッシュインスタンス
export const audioCache = new AudioCache();

// 定期的にクリーンアップを実行（5分ごと）
if (typeof window !== "undefined") {
	setInterval(
		() => {
			audioCache.cleanup();
		},
		5 * 60 * 1000,
	);
}
