/**
 * MediaRecorderのブラウザサポートを確認するユーティリティ
 */

export interface MediaRecorderSupportInfo {
	isSupported: boolean;
	supportedMimeTypes: string[];
	recommendedMimeType: string | null;
}

/**
 * MediaRecorderがサポートされているか確認
 */
export function checkMediaRecorderSupport(): MediaRecorderSupportInfo {
	const isSupported = typeof MediaRecorder !== "undefined";

	if (!isSupported) {
		return {
			isSupported: false,
			supportedMimeTypes: [],
			recommendedMimeType: null,
		};
	}

	const typesToCheck = [
		"audio/webm;codecs=opus",
		"audio/webm",
		"audio/ogg;codecs=opus",
		"audio/ogg",
		"audio/mp4",
		"audio/mpeg",
		"audio/wav",
	];

	const supportedMimeTypes = typesToCheck.filter((type) =>
		MediaRecorder.isTypeSupported(type),
	);

	return {
		isSupported: true,
		supportedMimeTypes,
		recommendedMimeType: supportedMimeTypes[0] || null,
	};
}

/**
 * ブラウザのMediaRecorderサポート情報をコンソールに出力
 */
export function logMediaRecorderSupport(): void {
	const support = checkMediaRecorderSupport();

	console.log("=== MediaRecorder サポート情報 ===");
	console.log("サポート状況:", support.isSupported ? "✓ サポート" : "✗ 非サポート");

	if (support.isSupported) {
		console.log("推奨MIMEタイプ:", support.recommendedMimeType || "なし");
		console.log("サポート済みMIMEタイプ:", support.supportedMimeTypes);
	}

	console.log("================================");
}
