"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, ArrowLeft, ThumbsUp, MessageSquare, TrendingUp, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PartnerFeedbackPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [feedback, setFeedback] = useState<{
    sessionId: string;
    partnerName: string;
    duration: number;
    completedAt: string;
    // AI分析フィードバック
    aiGoodPoints: string;
    aiImprovementPoints: string;
    aiOverallScore: number;
    // ジェスチャーメトリクス（simulationと同じ）
    gestureMetrics?: {
      smileIntensityAvg: number;
      gazeScoreAvg: number;
      lookingSamples: number;
      totalSamples: number;
    };
    // パートナーからのフィードバック（オプション）
    partnerRating?: number;
    partnerComment?: string;
    partnerGoodPoints?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        // TODO: 実際のAPIエンドポイントを呼び出す
        // const response = await fetch(`/api/partner-sessions/${sessionId}/feedback`);
        // const data = await response.json();

        // Mock data
        setTimeout(() => {
          setFeedback({
            sessionId,
            partnerName: "まゆ",
            duration: 900, // 15分
            completedAt: new Date().toISOString(),
            aiGoodPoints: "会話中の笑顔が自然で、相手に好印象を与えていました。視線も適切に相手を見ており、傾聴の姿勢が伝わってきました。質問も具体的で、会話を深める工夫が見られました。",
            aiImprovementPoints: "時折、相手の話を遮ってしまう場面がありました。もう少し間を取って、相手の話を最後まで聞く意識を持つとより良いでしょう。また、声のトーンが少し単調になる場面があったので、感情を込めて話すとさらに魅力的になります。",
            aiOverallScore: 78,
            gestureMetrics: {
              smileIntensityAvg: 0.72,
              gazeScoreAvg: 0.85,
              lookingSamples: 680,
              totalSamples: 800,
            },
            partnerRating: 4,
            partnerComment: "とても誠実に話を聞いてくださって嬉しかったです！もう少しリラックスして話すと、さらに自然な会話になると思います。",
            partnerGoodPoints: "真剣に話を聞いてくれる姿勢が素敵でした",
          });
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [sessionId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}分`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">AIがフィードバックを生成中...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <p className="text-center text-muted-foreground">
            フィードバックの読み込みに失敗しました
          </p>
          <Link href="/" className="mt-4 block">
            <Button className="w-full rounded-full">ホームに戻る</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">恋ai</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              実践練習フィードバック
            </h1>
            <p className="text-muted-foreground">
              AIとパートナーからのフィードバックです
            </p>
          </div>

          {/* Session Info */}
          <Card className="p-6 border-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">パートナー</p>
                  <p className="font-semibold text-foreground">{feedback.partnerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">実施日時</p>
                  <p className="font-semibold text-foreground">
                    {formatDate(feedback.completedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">セッション時間</p>
                  <p className="font-semibold text-foreground">
                    {formatDuration(feedback.duration)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Overall Score */}
          <Card className="p-6 sm:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-foreground">AI総合スコア</h2>
              <div className="relative w-32 h-32 mx-auto">
                <svg
                  className="w-full h-full -rotate-90"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - feedback.aiOverallScore / 100)}`}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">
                    {feedback.aiOverallScore}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {feedback.aiOverallScore >= 80 && "素晴らしい会話でした！"}
                {feedback.aiOverallScore >= 60 && feedback.aiOverallScore < 80 && "良い会話ができました！"}
                {feedback.aiOverallScore < 60 && "次回はもっと良くなります！"}
              </p>
            </div>
          </Card>

          {/* AI Feedback */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">AIフィードバック</h2>

            {/* Good Points */}
            <Card className="p-6 border-2 border-green-500/20 bg-green-500/5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-foreground">良かった点</h3>
                </div>
                <p className="text-foreground leading-relaxed">
                  {feedback.aiGoodPoints}
                </p>
              </div>
            </Card>

            {/* Improvement Points */}
            <Card className="p-6 border-2 border-blue-500/20 bg-blue-500/5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-foreground">改善できる点</h3>
                </div>
                <p className="text-foreground leading-relaxed">
                  {feedback.aiImprovementPoints}
                </p>
              </div>
            </Card>
          </div>

          {/* Gesture Metrics */}
          {feedback.gestureMetrics && (
            <Card className="p-6 border-2">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">表情・視線分析</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">笑顔の強度</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${feedback.gestureMetrics.smileIntensityAvg * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {(feedback.gestureMetrics.smileIntensityAvg * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">視線スコア</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${feedback.gestureMetrics.gazeScoreAvg * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {(feedback.gestureMetrics.gazeScoreAvg * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Partner Feedback */}
          {feedback.partnerRating && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                パートナーからのフィードバック
              </h2>

              <Card className="p-6 border-2 border-pink-500/20 bg-pink-500/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">評価</h3>
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
                      <p className="text-sm text-muted-foreground mb-1">良かった点</p>
                      <p className="text-foreground">{feedback.partnerGoodPoints}</p>
                    </div>
                  )}

                  {feedback.partnerComment && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">コメント</p>
                      <div className="bg-background p-4 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-pink-500 flex-shrink-0 mt-1" />
                          <p className="text-foreground">{feedback.partnerComment}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/practice" className="flex-1">
              <Button size="lg" className="w-full rounded-full">
                もう一度練習する
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button size="lg" variant="outline" className="w-full rounded-full">
                ホームに戻る
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
