"use client";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
	Heart,
	ThumbsUp,
	Lightbulb,
	ArrowLeft,
	RotateCcw,
	Loader2,
	AlertCircle,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { feedbackApi, sessionApi } from "@/lib/api";
import type { Feedback } from "@/types/api";

function FeedbackContent() {
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("sessionId");

	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [scoreHistory, setScoreHistory] = useState<
		{
			sessionId: string;
			score: number;
			createdAt: string;
		}[]
	>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFeedback = async () => {
			if (!sessionId) {
				setIsLoading(false);
				setError("セッションIDが見つかりません");
				return;
			}

			try {
				setIsLoading(true);
				setError(null);
				const result = await feedbackApi.generateFeedback({
					sessionId,
				});
				setFeedback(result.feedback);
				if (result.feedback.overallScore !== null) {
					const score = result.feedback.overallScore;
					setScoreHistory((prev) => {
						const next = prev.filter(
							(item) => item.sessionId !== sessionId,
						);
						next.push({
							sessionId,
							score,
							createdAt: result.feedback.createdAt,
						});
						return next.sort(
							(a, b) =>
								new Date(a.createdAt).getTime() -
								new Date(b.createdAt).getTime(),
						);
					});
				}
			} catch (err) {
				console.error("Failed to generate feedback:", err);

				// エラーメッセージをユーザーフレンドリーに変換
				let errorMessage = "フィードバックの生成に失敗しました";

				if (err instanceof Error) {
					if (err.message.includes("No messages found")) {
						errorMessage = "会話が記録されていません。まずは会話を始めてみましょう。";
					} else if (err.message.includes("Session not found")) {
						errorMessage = "セッションが見つかりません。";
					} else {
						errorMessage = err.message;
					}
				}

				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		fetchFeedback();
	}, [sessionId]);

	useEffect(() => {
		const fetchScoreHistory = async () => {
			try {
				setIsHistoryLoading(true);
				setHistoryError(null);
				const sessions = await sessionApi.getSessions();
				const historyData = sessions
					.flatMap((session) => {
						const score = session.feedback?.overallScore;
						if (typeof score !== "number") {
							return [];
						}
						const createdAt =
							session.feedback?.createdAt ?? session.createdAt;
						return [
							{
								sessionId: session.id,
								score,
								createdAt,
							},
						];
					})
					.sort(
						(a, b) =>
							new Date(a.createdAt).getTime() -
							new Date(b.createdAt).getTime(),
					);
				setScoreHistory(historyData);
			} catch (err) {
				console.error("Failed to fetch score history:", err);
				setHistoryError("過去のスコア履歴を取得できませんでした。");
			} finally {
				setIsHistoryLoading(false);
			}
		};

		void fetchScoreHistory();
	}, []);

	const [selectedCategory, setSelectedCategory] = useState<
		"gesture" | "conversation"
	>("conversation");

	const conversationGoodPointsList = useMemo(() => {
		if (!feedback) return [];
		return feedback.goodPoints
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}, [feedback]);

	const conversationImprovementPointsList = useMemo(() => {
		if (!feedback) return [];
		return feedback.improvementPoints
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}, [feedback]);

	const gestureGoodPointsList = useMemo(() => {
		if (!feedback?.gestureGoodPoints) return [];
		return feedback.gestureGoodPoints
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}, [feedback]);

	const gestureImprovementPointsList = useMemo(() => {
		if (!feedback?.gestureImprovementPoints) return [];
		return feedback.gestureImprovementPoints
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}, [feedback]);

	const activeGoodPoints =
		selectedCategory === "conversation"
			? conversationGoodPointsList
			: gestureGoodPointsList;

	const activeImprovementPoints =
		selectedCategory === "conversation"
			? conversationImprovementPointsList
			: gestureImprovementPointsList;

	const categoryLabel =
		selectedCategory === "conversation" ? "会話" : "仕草";

	const scoreChartMetrics = useMemo(() => {
		if (scoreHistory.length === 0) {
			return {
				points: [] as {
					sessionId: string;
					score: number;
					createdAt: string;
					x: number;
					y: number;
				}[],
				polyline: "",
				ticks: [100, 75, 50, 25, 0],
				minBound: 0,
				maxBound: 100,
				range: 100,
			};
		}

		const scores = scoreHistory.map((item) => item.score);
		const minScore = Math.min(...scores);
		const maxScore = Math.max(...scores);

		const minBound = Math.min(0, Math.floor(minScore / 10) * 10);
		const maxBound = Math.max(100, Math.ceil(maxScore / 10) * 10);
		const range = maxBound - minBound || 1;

		const points = scoreHistory.map((item, index) => {
			const x =
				scoreHistory.length === 1
					? 50
					: (index / (scoreHistory.length - 1)) * 100;
			const y = 100 - ((item.score - minBound) / range) * 100;
			return { ...item, x, y };
		});

		const polyline = points
			.map(({ x, y }) => `${x},${y}`)
			.join(" ");

		const defaultTicks = [100, 75, 50, 25, 0];
		const tickSet = new Set<number>();
		for (const tick of defaultTicks) {
			if (tick <= maxBound && tick >= minBound) {
				tickSet.add(tick);
			}
		}
		tickSet.add(maxBound);
		tickSet.add(minBound);
		const ticks = Array.from(tickSet).sort((a, b) => b - a);

		return {
			points,
			polyline,
			ticks,
			minBound,
			maxBound,
			range,
		};
	}, [scoreHistory]);

	const formattedScoreHistory = useMemo(() => {
		return scoreHistory.map((item, index) => {
			const date = new Date(item.createdAt);
			const label = new Intl.DateTimeFormat("ja-JP", {
				month: "numeric",
				day: "numeric",
			}).format(date);

			return {
				...item,
				label: `${label} (${index + 1})`,
			};
		});
	}, [scoreHistory]);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 flex items-center justify-between bg-card/50 backdrop-blur-sm border-b border-border">
				<Link href="/">
					<Button variant="ghost" size="sm" className="rounded-full">
						<ArrowLeft className="w-4 h-4 mr-2" />
						ホームへ
					</Button>
				</Link>
				<div className="flex items-center gap-2">
					<Heart className="w-6 h-6 text-primary fill-primary" />
					<span className="font-semibold text-foreground">恋ai</span>
				</div>
				<div className="w-20" /> {/* Spacer for alignment */}
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center p-6">
				{isLoading ? (
					<div className="text-center space-y-4">
						<Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
						<p className="text-muted-foreground text-lg">
							フィードバックを生成中...
						</p>
						<p className="text-muted-foreground text-sm">
							AIがあなたの会話を分析しています
						</p>
					</div>
				) : error ? (
					<div className="max-w-md w-full space-y-6">
						<Card className="p-8 border-2 border-destructive/20">
							<div className="text-center space-y-4">
								<AlertCircle className="w-16 h-16 text-destructive mx-auto" />
								<h2 className="text-2xl font-bold text-foreground">
									{error.includes("会話が記録されていません")
										? "会話がまだありません"
										: "エラーが発生しました"}
								</h2>
								<p className="text-muted-foreground">{error}</p>
								<div className="flex flex-col gap-3">
									<Link href="/simulation">
										<Button size="lg" className="rounded-full w-full">
											<RotateCcw className="w-5 h-5 mr-2" />
											会話を始める
										</Button>
									</Link>
									<Link href="/">
										<Button size="lg" variant="outline" className="rounded-full w-full">
											<ArrowLeft className="w-5 h-5 mr-2" />
											ホームに戻る
										</Button>
									</Link>
								</div>
							</div>
						</Card>
					</div>
				) : !feedback ? (
					<div className="max-w-md w-full space-y-6">
						<Card className="p-8 border-2">
							<div className="text-center space-y-4">
								<AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
								<h2 className="text-2xl font-bold text-foreground">
									フィードバックがありません
								</h2>
								<p className="text-muted-foreground">
									会話セッションが見つかりませんでした
								</p>
								<Link href="/simulation">
									<Button size="lg" className="rounded-full mt-4">
										会話を始める
									</Button>
								</Link>
							</div>
						</Card>
					</div>
				) : (
					<div className="max-w-3xl w-full space-y-6">
          {/* Avatar */}
						<div className="flex justify-center">
							<div className="relative w-32 h-32">
																<Image
																		src="/IMG_8059.webp"
								alt="恋AI アバター"
								fill
								className="object-cover rounded-full drop-shadow-lg border-2 border-primary/20"
							/>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              会話フィードバック
            </h1>
            <p className="text-muted-foreground">
              AIがあなたの会話を分析しました
            </p>
          </div>

						{/* Overall Score */}
						<Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
							<div className="space-y-2">
				<p className="text-sm text-muted-foreground font-medium">
					総合スコア
				</p>
				<div className="text-6xl font-bold text-primary">
					{feedback.overallScore}
				</div>
				<p className="text-sm text-muted-foreground">/ 100点</p>
			</div>
		</Card>

						{/* Category Toggle */}
						<div className="flex justify-center gap-4">
							<Button
								type="button"
								variant={selectedCategory === "conversation" ? "default" : "outline"}
								className="rounded-full px-6"
								onClick={() => setSelectedCategory("conversation")}
							>
								会話
							</Button>
							<Button
								type="button"
								variant={selectedCategory === "gesture" ? "default" : "outline"}
								className="rounded-full px-6"
								onClick={() => setSelectedCategory("gesture")}
							>
								仕草
							</Button>
						</div>

						{/* Good Points */}
						<Card className="p-6 border-2 space-y-4">
							<div className="flex items-center gap-2">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
									<ThumbsUp className="w-5 h-5 text-primary" />
								</div>
								<h2 className="text-xl font-semibold text-foreground">
									良かった点（{categoryLabel}）
								</h2>
							</div>
							{activeGoodPoints.length > 0 ? (
								<ul className="space-y-3">
									{activeGoodPoints.map((point, index) => (
										<li
											key={`${selectedCategory}-good-${point.substring(0, 30)}-${index}`}
											className="flex gap-3 items-start rounded-xl border border-primary/20 bg-primary/5 p-4"
										>
											<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
												{index + 1}
											</div>
											<p className="font-semibold text-foreground">{point}</p>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									{selectedCategory === "gesture"
										? "カメラ分析データがまだありません。カメラアクセスを許可して会話すると表示されます。"
										: "良かった点が記録されていません。"}
								</p>
							)}
						</Card>

						{/* Improvement Points */}
						<Card className="p-6 border-2 space-y-4">
							<div className="flex items-center gap-2">
								<div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
									<Lightbulb className="w-5 h-5 text-accent" />
								</div>
								<h2 className="text-xl font-semibold text-foreground">
									改善点（{categoryLabel}）
								</h2>
							</div>
							{activeImprovementPoints.length > 0 ? (
								<ul className="space-y-3">
									{activeImprovementPoints.map((point, index) => (
										<li
											key={`${selectedCategory}-improve-${point.substring(0, 30)}-${index}`}
											className="flex gap-3 items-start rounded-xl border border-accent/20 bg-accent/5 p-4"
										>
											<div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
												{index + 1}
											</div>
											<p className="font-semibold text-foreground">{point}</p>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									{selectedCategory === "gesture"
										? "仕草の改善点は、カメラ分析データが集まり次第ここに表示されます。"
										: "改善点が記録されていません。"}
								</p>
							)}
						</Card>

						{/* Score History */}
						<Card className="p-6 border-2 space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div className="flex items-center gap-2">
									<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
										<TrendingUp className="w-5 h-5 text-primary" />
									</div>
									<div>
										<h2 className="text-xl font-semibold text-foreground">
											これまでのスコア推移
										</h2>
										<p className="text-sm text-muted-foreground">
											過去のセッションで獲得した総合スコアの変化を確認できます
										</p>
									</div>
								</div>
								{isHistoryLoading && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="w-4 h-4 animate-spin" />
										読み込み中
									</div>
								)}
							</div>
							{historyError ? (
								<p className="text-sm text-destructive">{historyError}</p>
							) : scoreHistory.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									まだスコア履歴がありません。練習を続けるとここにスコアが表示されます。
								</p>
							) : (
								<>
									<div className="relative h-56 w-full">
										<svg
											className="absolute inset-0 w-full h-full"
											viewBox="0 0 100 100"
											preserveAspectRatio="xMidYMid meet"
										>
											{scoreChartMetrics.ticks.map((tick) => {
												const y =
													100 -
													((tick - scoreChartMetrics.minBound) /
														scoreChartMetrics.range) *
														100;
												return (
													<line
														key={`grid-${tick}`}
														x1="0"
														x2="100"
														y1={y}
														y2={y}
														stroke="currentColor"
														strokeOpacity="0.1"
														strokeWidth="0.5"
													/>
												);
											})}
											{scoreChartMetrics.points.length > 1 && (
												<polyline
													points={scoreChartMetrics.polyline}
													fill="none"
													stroke="currentColor"
													strokeWidth="1.25"
													strokeLinecap="round"
													strokeLinejoin="round"
													className="text-primary"
												/>
											)}
											{scoreChartMetrics.points.map((point) => (
												<g key={point.sessionId}>
													<circle
														cx={point.x}
														cy={point.y}
														r="1.6"
														fill="var(--color-chart-1)"
														stroke="var(--color-chart-1)"
														strokeWidth="0.75"
													/>
												</g>
											))}
										</svg>
										<div className="absolute inset-0 pointer-events-none text-xs text-muted-foreground">
											{scoreChartMetrics.ticks.map((tick) => {
												const y =
													100 -
													((tick - scoreChartMetrics.minBound) /
														scoreChartMetrics.range) *
														100;
												return (
													<div
														key={`label-${tick}`}
														className="absolute left-0 -translate-y-1/2"
														style={{ top: `${y}%` }}
													>
														<span className="rounded-md bg-background/70 px-2 py-0.5">
															{tick}
														</span>
													</div>
												);
											})}
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{formattedScoreHistory.map((item) => (
											<div
												key={`${item.sessionId}-${item.createdAt}`}
												className="rounded-lg border border-border/60 bg-card/60 px-4 py-3"
											>
												<p className="text-sm font-medium text-muted-foreground">
													{item.label}
												</p>
												<p className="text-lg font-semibold text-foreground">
													{item.score} 点
												</p>
											</div>
										))}
									</div>
								</>
							)}
						</Card>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
							<Link href="/simulation" className="flex-1 sm:flex-initial">
								<Button size="lg" className="w-full rounded-full">
									<RotateCcw className="w-5 h-5 mr-2" />
									もう一度練習する
								</Button>
							</Link>
							<Link href="/" className="flex-1 sm:flex-initial">
								<Button
									size="lg"
									variant="outline"
									className="w-full rounded-full bg-transparent"
								>
									ホームに戻る
								</Button>
							</Link>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}

export default function FeedbackPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
					<p className="text-muted-foreground text-lg">読み込み中...</p>
				</div>
			</div>
		}>
			<FeedbackContent />
		</Suspense>
	);
}
