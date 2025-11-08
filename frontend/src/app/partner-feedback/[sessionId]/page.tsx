"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	Heart,
	Lightbulb,
	Loader2,
	MessageSquare,
	RotateCcw,
	ThumbsUp,
	TrendingUp,
	User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { config } from "@/lib/config";

type PartnerFeedback = {
	id: string;
	sessionId: string;
	aiGoodPoints: string | null;
	aiImprovementPoints: string | null;
	aiOverallScore: number | null;
	partnerGoodPoints: string | null;
	partnerImprovementPoints: string | null;
	partnerRating: number | null;
	partnerComment: string | null;
	createdAt: string;
};

type PartnerSession = {
	id: string;
	userId: string;
	partnerId: string;
	status: string;
	startedAt: string | null;
	endedAt: string | null;
	duration: number | null;
	partner: {
		id: string;
		name: string;
	};
};

export default function PartnerFeedbackPage() {
	const params = useParams();
	const sessionId = params.sessionId as string;

	const [feedback, setFeedback] = useState<PartnerFeedback | null>(null);
	const [session, setSession] = useState<PartnerSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<"ai" | "partner">(
		"ai",
	);

	useEffect(() => {
		const fetchFeedback = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch feedback from backend API
				const apiUrl = `${config.api.baseUrl}/api/partners/sessions/${sessionId}/feedback`;
				console.log("Fetching feedback from:", apiUrl);

				const response = await fetch(apiUrl, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				console.log("Response status:", response.status);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error("Error response:", errorData);
					throw new Error(
						errorData.error || "フィードバックの取得に失敗しました",
					);
				}

				const data = await response.json();
				console.log("Feedback data:", data);
				setFeedback(data.feedback);
				setSession(data.session);
			} catch (err) {
				console.error("Error fetching feedback:", err);
				setError(
					err instanceof Error
						? err.message
						: "フィードバックの取得に失敗しました",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchFeedback();
	}, [sessionId]);

	const formatDuration = (seconds: number | null) => {
		if (!seconds) return "0分";
		const mins = Math.floor(seconds / 60);
		return `${mins}分`;
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "—";
		const date = new Date(dateString);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const aiGoodPointsList = useMemo(() => {
		if (!feedback?.aiGoodPoints) return [];
		return feedback.aiGoodPoints
			.split(/[。！]/g)
			.map((line) => line.trim())
			.filter(Boolean)
			.slice(0, 3);
	}, [feedback]);

	const aiImprovementPointsList = useMemo(() => {
		if (!feedback?.aiImprovementPoints) return [];
		return feedback.aiImprovementPoints
			.split(/[。！]/g)
			.map((line) => line.trim())
			.filter(Boolean)
			.slice(0, 3);
	}, [feedback]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
					<p className="text-muted-foreground">フィードバックを読み込み中...</p>
				</div>
			</div>
		);
	}

	if (error || !session) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="p-8 max-w-md w-full">
					<div className="text-center space-y-4">
						<AlertCircle className="w-16 h-16 text-destructive mx-auto" />
						<h2 className="text-2xl font-bold text-foreground">
							エラーが発生しました
						</h2>
						<p className="text-muted-foreground">
							{error || "セッションが見つかりません"}
						</p>
						<Link href="/" className="block">
							<Button className="w-full rounded-full">
								<ArrowLeft className="w-4 h-4 mr-2" />
								ホームに戻る
							</Button>
						</Link>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center p-4 sm:p-6">
				<div className="max-w-3xl w-full space-y-4 sm:space-y-6 px-2">
					{/* Avatar */}
					<div className="flex justify-center">
						<div className="relative w-24 h-24 sm:w-32 sm:h-32">
							<Image
								src="/partner-avatar.png"
								alt="パートナー"
								fill
								className="object-cover rounded-full drop-shadow-lg border-2 border-primary/20"
								onError={(e) => {
									// Fallback to a default image if partner-avatar.png doesn't exist
									e.currentTarget.src = "/maki.webp";
								}}
							/>
						</div>
					</div>

					{/* Title */}
					<div className="text-center space-y-1 sm:space-y-2">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
							実践練習フィードバック
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							AIとパートナーがあなたの会話を分析しました
						</p>
					</div>

					{/* Session Info */}
					<Card className="p-6 border-2">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="flex items-center gap-3">
								<User className="w-5 h-5 text-primary" />
								<div>
									<p className="text-sm text-muted-foreground">パートナー</p>
									<p className="font-semibold text-foreground">
										{session.partner.name}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<TrendingUp className="w-5 h-5 text-primary" />
								<div>
									<p className="text-sm text-muted-foreground">実施日時</p>
									<p className="font-semibold text-foreground">
										{formatDate(session.endedAt || session.startedAt)}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Activity className="w-5 h-5 text-primary" />
								<div>
									<p className="text-sm text-muted-foreground">
										セッション時間
									</p>
									<p className="font-semibold text-foreground">
										{formatDuration(session.duration)}
									</p>
								</div>
							</div>
						</div>
					</Card>

					{/* AI Overall Score */}
					{feedback && feedback.aiOverallScore !== null && (
						<Card className="p-6 sm:p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
							<div className="space-y-3 sm:space-y-4">
								<div className="space-y-1 sm:space-y-2">
									<p className="text-xs sm:text-sm text-muted-foreground font-medium">
										AI総合スコア
									</p>
									<div className="text-5xl sm:text-6xl font-bold text-primary">
										{feedback.aiOverallScore}
									</div>
									<p className="text-xs sm:text-sm text-muted-foreground">
										/ 100点
									</p>
								</div>
								<p className="text-sm text-muted-foreground">
									{feedback.aiOverallScore >= 80 && "素晴らしい会話でした！"}
									{feedback.aiOverallScore >= 60 &&
										feedback.aiOverallScore < 80 &&
										"良い会話ができました！"}
									{feedback.aiOverallScore < 60 && "次回はもっと良くなります！"}
								</p>
							</div>
						</Card>
					)}

					{/* Category Toggle */}
					<div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
						<Button
							type="button"
							variant={selectedCategory === "ai" ? "default" : "outline"}
							className="rounded-full px-4 sm:px-6 text-xs sm:text-sm"
							onClick={() => setSelectedCategory("ai")}
						>
							AIフィードバック
						</Button>
						{feedback?.partnerRating && (
							<Button
								type="button"
								variant={selectedCategory === "partner" ? "default" : "outline"}
								className="rounded-full px-4 sm:px-6 text-xs sm:text-sm"
								onClick={() => setSelectedCategory("partner")}
							>
								パートナーからの評価
							</Button>
						)}
					</div>

					{/* AI Feedback */}
					{selectedCategory === "ai" && feedback && (
						<>
							{/* AI Good Points */}
							{aiGoodPointsList.length > 0 && (
								<Card className="p-6 border-2 space-y-4">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
											<ThumbsUp className="w-5 h-5 text-primary" />
										</div>
										<h2 className="text-xl font-semibold text-foreground">
											良かった点
										</h2>
									</div>
									<ul className="space-y-3">
										{aiGoodPointsList.map((point, index) => (
											<li
												key={`ai-good-${index}`}
												className="flex gap-3 items-start rounded-xl border border-primary/20 bg-primary/5 p-4"
											>
												<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
													{index + 1}
												</div>
												<p className="font-semibold text-foreground">{point}</p>
											</li>
										))}
									</ul>
								</Card>
							)}

							{/* AI Improvement Points */}
							{aiImprovementPointsList.length > 0 && (
								<Card className="p-6 border-2 space-y-4">
									<div className="flex items-center gap-2">
										<div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
											<Lightbulb className="w-5 h-5 text-accent" />
										</div>
										<h2 className="text-xl font-semibold text-foreground">
											改善できる点
										</h2>
									</div>
									<ul className="space-y-3">
										{aiImprovementPointsList.map((point, index) => (
											<li
												key={`ai-improve-${index}`}
												className="flex gap-3 items-start rounded-xl border border-accent/20 bg-accent/5 p-4"
											>
												<div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
													{index + 1}
												</div>
												<p className="font-semibold text-foreground">{point}</p>
											</li>
										))}
									</ul>
								</Card>
							)}
						</>
					)}

					{/* Partner Feedback */}
					{selectedCategory === "partner" && feedback?.partnerRating && (
						<Card className="p-6 border-2 border-pink-500/20 bg-pink-500/5 space-y-4">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="font-bold text-foreground text-lg">評価</h3>
									<div className="flex gap-1">
										{[1, 2, 3, 4, 5].map((star) => (
											<Heart
												key={star}
												className={`w-5 h-5 ${
													star <= (feedback.partnerRating ?? 0)
														? "text-pink-500 fill-pink-500"
														: "text-gray-300"
												}`}
											/>
										))}
									</div>
								</div>

								{feedback.partnerGoodPoints && (
									<div>
										<div className="flex items-center gap-2 mb-2">
											<ThumbsUp className="w-4 h-4 text-pink-500" />
											<p className="font-semibold text-foreground">
												良かった点
											</p>
										</div>
										<p className="text-foreground bg-background p-4 rounded-lg border border-border">
											{feedback.partnerGoodPoints}
										</p>
									</div>
								)}

								{feedback.partnerImprovementPoints && (
									<div>
										<div className="flex items-center gap-2 mb-2">
											<Lightbulb className="w-4 h-4 text-pink-500" />
											<p className="font-semibold text-foreground">
												改善できる点
											</p>
										</div>
										<p className="text-foreground bg-background p-4 rounded-lg border border-border">
											{feedback.partnerImprovementPoints}
										</p>
									</div>
								)}

								{feedback.partnerComment && (
									<div>
										<div className="flex items-center gap-2 mb-2">
											<MessageSquare className="w-4 h-4 text-pink-500" />
											<p className="font-semibold text-foreground">コメント</p>
										</div>
										<div className="bg-background p-4 rounded-lg border border-border">
											<div className="flex items-start gap-3">
												<MessageSquare className="w-5 h-5 text-pink-500 flex-shrink-0 mt-1" />
												<p className="text-foreground">
													{feedback.partnerComment}
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</Card>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 pt-4">
						<Link href="/partner-matching" className="flex-1">
							<Button size="lg" className="w-full rounded-full">
								<RotateCcw className="w-5 h-5 mr-2" />
								もう一度練習する
							</Button>
						</Link>
						<Link href="/" className="flex-1">
							<Button
								size="lg"
								variant="outline"
								className="w-full rounded-full bg-transparent"
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								ホームに戻る
							</Button>
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
