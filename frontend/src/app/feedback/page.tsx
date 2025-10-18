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
import { useEffect, useState, Suspense } from "react";
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
      <main className="flex-1 flex items-center justify-center p-8">
        {isLoading ? (
          <div className="text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto soft-shadow">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xl font-medium">
                フィードバックを生成中...
              </p>
              <p className="text-muted-foreground text-sm">
                AIがあなたの会話を分析しています
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-lg w-full space-y-6 animate-fade-in-up">
            <Card className="text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mx-auto soft-shadow">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  {error.includes("会話が記録されていません")
                    ? "会話がまだありません"
                    : "エラーが発生しました"}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <div className="flex flex-col gap-4">
                <Link href="/simulation">
                  <Button size="lg" className="w-full heart-effect">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    会話を始める
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="w-full">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    ホームに戻る
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : !feedback ? (
          <div className="max-w-lg w-full space-y-6 animate-fade-in-up">
            <Card className="text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center mx-auto soft-shadow">
                <AlertCircle className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  フィードバックがありません
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  会話セッションが見つかりませんでした
                </p>
              </div>
              <Link href="/simulation">
                <Button size="lg" className="heart-effect">
                  会話を始める
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <div className="max-w-4xl w-full space-y-8 animate-fade-in-up">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative w-40 h-40 animate-gentle-bounce">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-110" />
                <Image
                  src="/avatar.png"
                  alt="恋AI アバター"
                  fill
                  className="object-cover rounded-full soft-shadow-lg border-4 border-primary/30 relative z-10"
                />
                {/* Floating hearts around avatar */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center soft-shadow animate-soft-pulse">
                  <Heart className="w-3 h-3 text-primary-foreground fill-current" />
                </div>
                <div
                  className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center soft-shadow animate-soft-pulse"
                  style={{ animationDelay: "1s" }}
                >
                  <Sparkles className="w-2 h-2 text-accent-foreground" />
                </div>
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
            <Card
              className="text-center space-y-6 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto soft-shadow">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium text-lg">
                  総合スコア
                </p>
                <div className="text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {feedback.overallScore}
                </div>
                <p className="text-muted-foreground">/ 100点</p>
              </div>
            </Card>

            {/* Good Points */}
            <Card
              className="space-y-6 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center soft-shadow">
                  <ThumbsUp className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  良かった点
                </h2>
              </div>
              <ul className="space-y-4">
                {goodPointsList?.map((point, index) => (
                  <li
                    key={point}
                    className="flex gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-foreground text-sm font-bold">
                        ✓
                      </span>
                    </div>
                    <span className="text-muted-foreground leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Improvements */}
            <Card
              className="space-y-6 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center soft-shadow">
                  <Lightbulb className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  改善できる点
                </h2>
              </div>
              <ul className="space-y-4">
                {improvementPointsList?.map((point, index) => (
                  <li
                    key={point}
                    className="flex gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-accent-foreground text-sm font-bold">
                        →
                      </span>
                    </div>
                    <span className="text-muted-foreground leading-relaxed">
                      {point}
                    </span>
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
