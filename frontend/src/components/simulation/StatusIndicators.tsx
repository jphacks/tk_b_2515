interface RecordingStatusProps {
	isRecording: boolean;
	isProcessing: boolean;
}

export function RecordingStatus({
	isRecording,
	isProcessing,
}: RecordingStatusProps) {
	return (
		<div className="absolute top-3 sm:top-4 md:top-6 right-2 sm:right-4 md:right-6 flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border border-white/10">
			<div
				className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
					isRecording
						? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
						: isProcessing
							? "bg-yellow-500 animate-pulse"
							: "bg-gray-500"
				}`}
			/>
			<span className="text-white font-semibold text-xs sm:text-sm">
				{isProcessing ? "処理中" : isRecording ? "録音中" : "待機中"}
			</span>
		</div>
	);
}

interface ErrorDisplayProps {
	mediaError?: Error | null;
	recorderError?: Error | null;
	facialError?: Error | null;
	conversationError?: Error | null;
}

export function ErrorDisplay({
	mediaError,
	recorderError,
	facialError,
	conversationError,
}: ErrorDisplayProps) {
	const error = mediaError || recorderError || facialError || conversationError;

	// STT関連: Unsupported language メッセージをより親しみやすく表示
	let friendlyMessage = error?.message;
	if (friendlyMessage) {
		if (friendlyMessage.includes("UNSUPPORTED_LANGUAGE") || friendlyMessage.includes("日本語または英語で話してください")) {
			friendlyMessage = "日本語か英語で話してみましょう。方言や特殊記号は認識できない場合があります。";
		}
		// APIキー未設定
		if (friendlyMessage.includes("API key not configured") || friendlyMessage.includes("API_KEY_NOT_CONFIGURED")) {
			friendlyMessage = "音声認識設定が未構成です。管理者に連絡してください。";
		}
		// 接続失敗
		if (friendlyMessage.includes("バックエンドサーバーに接続できません") || friendlyMessage.includes("Failed to connect")) {
			friendlyMessage = "サーバーに接続できません。バックエンドが起動しているか、ネットワーク/プロキシ設定を確認してください。";
		}
	}

	if (!error) return null;

	return (
		<div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-lg z-50">
			<div className="bg-destructive/95 backdrop-blur-md text-destructive-foreground px-6 py-4 rounded-lg shadow-2xl border-2 border-destructive space-y-2">
				<p className="text-sm font-bold text-center flex items-center justify-center gap-2">
					<span className="text-lg">⚠️</span>
					エラーが発生しました
				</p>
				<p className="text-sm text-center">{friendlyMessage}</p>
				{mediaError?.message.includes("拒否") && (
					<div className="pt-2 border-t border-destructive-foreground/20">
						<p className="text-xs text-center text-destructive-foreground/90">
							💡
							ブラウザのアドレスバー横のカメラアイコンをクリックして、アクセスを許可してください
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

interface TimerDisplayProps {
	timeRemaining: number | null;
	messageCount: number;
}

export function TimerDisplay({
	timeRemaining,
	messageCount,
}: TimerDisplayProps) {
	if (timeRemaining === null) return null;

	const minutes = Math.floor(timeRemaining / 60);
	const seconds = `${timeRemaining % 60}`.padStart(2, "0");
	const turnCount = Math.floor(messageCount / 2);

	return (
		<div className="text-center">
			<p className="text-xs text-primary mt-2">
				残り時間: {minutes}分{seconds}秒
			</p>
			{messageCount > 0 && (
				<p className="text-xs text-muted-foreground mt-1">
					会話ターン数: {turnCount}
				</p>
			)}
		</div>
	);
}
