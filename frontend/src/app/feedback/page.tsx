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
  Star,
  Sparkles,
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
            errorMessage =
              "会話が記録されていません。まずは会話を始めてみましょう。";
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

	// フィードバックのテキストを改行で分割して配列に変換
	const goodPointsList = feedback?.goodPoints
		.split("\n")
		.filter((line) => line.trim());
	const improvementPointsList = feedback?.improvementPoints
		.split("\n")
		.filter((line) => line.trim());

  return (
    <div className="min-h-screen flex flex-col gradient-pink">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-card/60 backdrop-blur-md border-b border-border/30 soft-shadow">
        <Link href="/">
          <Button variant="ghost" size="lg" className="heart-effect">
            <ArrowLeft className="w-5 h-5 mr-2" />
            ホームへ
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center soft-shadow">
            <Heart className="w-5 h-5 text-primary-foreground fill-current animate-soft-pulse" />
          </div>
          <span className="font-bold text-foreground text-xl">恋AI</span>
        </div>
        <div className="w-32" /> {/* Spacer for alignment */}
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
                src="/../../public/avatar.png"
                alt="恋AI アバター"
                fill
                className="object-cover rounded-full drop-shadow-lg border-2 border-primary/20"
              />
            </div>
          </div>

            {/* Title */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                会話フィードバック
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
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
								{goodPointsList?.map((point) => (
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
								{improvementPointsList?.map((point) => (
									<li key={point} className="flex gap-3">
										<span className="text-accent mt-1">→</span>
										<span className="text-muted-foreground">{point}</span>
									</li>
								))}
							</ul>
						</Card>

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-6 justify-center pt-6 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href="/simulation" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full heart-effect">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  もう一度練習する
                </Button>
              </Link>
              <Link href="/" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full">
                  <ArrowLeft className="w-5 h-5 mr-2" />
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground text-lg">読み込み中...</p>
          </div>
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
