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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { feedbackApi } from "@/lib/api";
import type { Feedback } from "@/types/api";

function FeedbackContent() {
	const searchParams = useSearchParams();
	const sessionId = searchParams.get("sessionId");

	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
									src="/avatar.png"
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
											key={`${selectedCategory}-good-${index}`}
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
											key={`${selectedCategory}-improve-${index}`}
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
