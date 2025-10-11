"use client";

// biome-ignore assist/source/organizeImports: <explanation>
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Heart, ThumbsUp, Lightbulb, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function FeedbackPage() {
	// Mock feedback data - will be replaced with actual AI-generated feedback
	const feedback = {
		goodPoints: [
			"明るい挨拶で会話を始められました",
			"相手の話に興味を示す質問ができていました",
			"適切なタイミングで相槌を打てていました",
		],
		improvements: [
			"話すスピードが少し早いので、もう少しゆっくり話すと良いでしょう",
			"相手の話を最後まで聞いてから返答すると、より良いコミュニケーションになります",
			"自分の意見を述べる際に、理由も添えると説得力が増します",
		],
		overallScore: 75,
	};

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
				<div className="max-w-3xl w-full space-y-6">
					{/* Avatar */}
					<div className="flex justify-center">
						<div className="relative w-32 h-32">
							<Image
								src="/../../public/avatar.png"
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

					{/* Good Points */}
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
							{feedback.goodPoints.map((point) => (
								<li key={point} className="flex gap-3">
									<span className="text-primary mt-1">✓</span>
									<span className="text-muted-foreground">{point}</span>
								</li>
							))}
						</ul>
					</Card>

					{/* Improvements */}
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
							{feedback.improvements.map((point) => (
								<li key={point} className="flex gap-3">
									<span className="text-accent mt-1">→</span>
									<span className="text-muted-foreground">{point}</span>
								</li>
							))}
						</ul>
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
			</main>
		</div>
	);
}
