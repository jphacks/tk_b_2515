"use client";

import { Eye, EyeOff, Smile, Frown, AlertCircle } from "lucide-react";
import type { FacialMetrics } from "@/hooks/useFacialAnalysis";

interface FacialFeedbackProps {
	metrics: FacialMetrics | null;
	isAnalyzing: boolean;
	className?: string;
}

/**
 * 表情分析結果をリアルタイムで表示するフィードバックコンポーネント
 */
export function FacialFeedback({
	metrics,
	isAnalyzing,
	className = "",
}: FacialFeedbackProps) {
	if (!isAnalyzing || !metrics) {
		return null;
	}

	// フィードバックメッセージの生成
	const getFeedbackMessage = (): {
		message: string;
		type: "good" | "warning" | "info";
	} => {
		if (!metrics.isLookingAtTarget && !metrics.isSmiling) {
			return {
				message: "相手を見て、笑顔を作りましょう",
				type: "warning",
			};
		}
		if (!metrics.isLookingAtTarget) {
			return {
				message: "相手の目を見て話しましょう",
				type: "warning",
			};
		}
		if (!metrics.isSmiling) {
			return {
				message: "もう少し笑顔を意識してみましょう",
				type: "info",
			};
		}
		return {
			message: "素晴らしい表情です！",
			type: "good",
		};
	};

	const feedback = getFeedbackMessage();

	return (
		<div className={`space-y-3 ${className}`}>
			{/* メインフィードバックメッセージ */}
			<div
				className={`p-4 rounded-lg border backdrop-blur-sm ${
					feedback.type === "good"
						? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
						: feedback.type === "warning"
							? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
							: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
				}`}
			>
				<div className="flex items-center gap-3">
					<AlertCircle className="w-5 h-5 flex-shrink-0" />
					<p className="font-medium text-sm">{feedback.message}</p>
				</div>
			</div>

			{/* 詳細メトリクス */}
			<div className="grid grid-cols-2 gap-2">
				{/* 笑顔メトリクス */}
				<div
					className={`p-3 rounded-lg border backdrop-blur-sm ${
						metrics.isSmiling
							? "bg-green-500/10 border-green-500/30"
							: "bg-gray-500/10 border-gray-500/30"
					}`}
				>
					<div className="flex items-center gap-2 mb-2">
						{metrics.isSmiling ? (
							<Smile className="w-4 h-4 text-green-600 dark:text-green-400" />
						) : (
							<Frown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
						)}
						<span className="text-xs font-semibold text-foreground">
							笑顔
						</span>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>強度</span>
							<span>{Math.round(metrics.smileIntensity * 100)}%</span>
						</div>
						<div className="h-2 bg-black/20 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-300 ${
									metrics.isSmiling ? "bg-green-500" : "bg-gray-400"
								}`}
								style={{ width: `${metrics.smileIntensity * 100}%` }}
							/>
						</div>
					</div>
				</div>

				{/* 視線メトリクス */}
				<div
					className={`p-3 rounded-lg border backdrop-blur-sm ${
						metrics.isLookingAtTarget
							? "bg-green-500/10 border-green-500/30"
							: "bg-gray-500/10 border-gray-500/30"
					}`}
				>
					<div className="flex items-center gap-2 mb-2">
						{metrics.isLookingAtTarget ? (
							<Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
						) : (
							<EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
						)}
						<span className="text-xs font-semibold text-foreground">
							アイコンタクト
						</span>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>精度</span>
							<span>{Math.round(metrics.gazeScore * 100)}%</span>
						</div>
						<div className="h-2 bg-black/20 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-all duration-300 ${
									metrics.isLookingAtTarget ? "bg-green-500" : "bg-gray-400"
								}`}
								style={{ width: `${metrics.gazeScore * 100}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* スコア表示 */}
			<div className="p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-muted-foreground">
						総合スコア
					</span>
					<span className="text-lg font-bold text-foreground">
						{Math.round(
							((metrics.smileIntensity + metrics.gazeScore) / 2) * 100,
						)}
						<span className="text-sm text-muted-foreground">/100</span>
					</span>
				</div>
			</div>
		</div>
	);
}
