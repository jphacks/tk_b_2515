"use client";

import {
  AlertCircle,
  ArrowLeft,
  Heart,
  Lightbulb,
  Loader2,
  RotateCcw,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { feedbackApi, sessionApi } from "@/lib/api";
import type { Feedback } from "@/types/api";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

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
            const next = prev.filter((item) => item.sessionId !== sessionId);
            next.push({
              sessionId,
              score,
              createdAt: result.feedback.createdAt,
            });
            return next.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          });
        }
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

  useEffect(() => {
    const fetchScoreHistory = async () => {
      try {
        setIsHistoryLoading(true);
        setHistoryError(null);

        // localStorageから現在のユーザーIDを取得
        const currentUserId = localStorage.getItem("conversationUserId");
        console.log("Current user ID from localStorage:", currentUserId);

        // userIdがない場合は履歴を表示しない
        if (!currentUserId) {
          setScoreHistory([]);
          setIsHistoryLoading(false);
          return;
        }

        // userIdをパラメータとして渡してフィルタ（バックエンド側でフィルタ）
        const sessions = await sessionApi.getSessions(currentUserId);
        const historyData = sessions
          .flatMap((session) => {
            const score = session.feedback?.overallScore;
            if (typeof score !== "number") {
              return [];
            }
            const createdAt = session.feedback?.createdAt ?? session.createdAt;
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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 10); // 最近10回のみに制限
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
      .filter(Boolean)
      .slice(0, 3); // 優先度の高い順に最大3個まで
  }, [feedback]);

  const conversationImprovementPointsList = useMemo(() => {
    if (!feedback) return [];
    return feedback.improvementPoints
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3); // 改善すべき優先度が高い順に最大3個まで
  }, [feedback]);

  const gestureGoodPointsList = useMemo(() => {
    if (!feedback?.gestureGoodPoints) return [];
    return feedback.gestureGoodPoints
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3); // 優先度の高い順に最大3個まで
  }, [feedback]);

  const gestureImprovementPointsList = useMemo(() => {
    if (!feedback?.gestureImprovementPoints) return [];
    return feedback.gestureImprovementPoints
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3); // 改善すべき優先度が高い順に最大3個まで
  }, [feedback]);

  const activeGoodPoints =
    selectedCategory === "conversation"
      ? conversationGoodPointsList
      : gestureGoodPointsList;

  const activeImprovementPoints =
    selectedCategory === "conversation"
      ? conversationImprovementPointsList
      : gestureImprovementPointsList;

  const categoryLabel = selectedCategory === "conversation" ? "会話" : "仕草";

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
        smoothPath: "",
        areaPath: "",
        ticks: [100, 75, 50, 25, 0],
        minBound: 0,
        maxBound: 100,
        range: 100,
      };
    }

    // グラフは時系列順（古い→新しい）で表示
    const sortedForChart = [...scoreHistory].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const scores = sortedForChart.map((item) => item.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const minBound = Math.min(0, Math.floor(minScore / 10) * 10);
    const maxBound = Math.max(100, Math.ceil(maxScore / 10) * 10);
    const range = maxBound - minBound || 1;

    const points = sortedForChart.map((item, index) => {
      const x =
        sortedForChart.length === 1
          ? 50
          : (index / (sortedForChart.length - 1)) * 100;
      const y = 100 - ((item.score - minBound) / range) * 100;
      return { ...item, x, y };
    });

    const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");

    // スムーズな曲線を作成（Catmull-Rom スプライン）
    const createSmoothPath = () => {
      if (points.length === 0) return "";
      if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
      if (points.length === 2) {
        return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
      }

      let path = `M ${points[0].x},${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const prev = i > 0 ? points[i - 1] : current;
        const afterNext = i < points.length - 2 ? points[i + 2] : next;

        // コントロールポイントを計算（tension = 0.3で滑らかさを調整）
        const tension = 0.3;
        const cp1x = current.x + (next.x - prev.x) * tension;
        const cp1y = current.y + (next.y - prev.y) * tension;
        const cp2x = next.x - (afterNext.x - current.x) * tension;
        const cp2y = next.y - (afterNext.y - current.y) * tension;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
      }

      return path;
    };

    const smoothPath = createSmoothPath();
    const areaPath = smoothPath ? `${smoothPath} L 100,100 L 0,100 Z` : "";

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
      smoothPath,
      areaPath,
      ticks,
      minBound,
      maxBound,
      range,
    };
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
              AIがまきとの会話を分析しています
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
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full w-full"
                    >
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
                  まずは話しかけてみよう！
                </h2>
                <p className="text-muted-foreground">
                  まずは話しかけてみよう！
                </p>
                <Link href="/simulation">
                  <Button size="lg" className="rounded-full mt-4">
                    まきにはなしかける(ドキドキ)
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
                variant={
                  selectedCategory === "conversation" ? "default" : "outline"
                }
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
                      key={`${selectedCategory}-good-${point.substring(
                        0,
                        30
                      )}-${index}`}
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
                      key={`${selectedCategory}-improve-${point.substring(
                        0,
                        30
                      )}-${index}`}
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
            <Card className="p-4 md:p-6 border-2 space-y-4">
              {/* Header Section */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-foreground pb-2">
                    {scoreHistory.length > 0
                      ? `${scoreHistory[0].score}点`
                      : "0点"}
                  </h2>
                  <p className="text-base font-normal text-muted-foreground">
                    最新のスコア
                  </p>
                </div>
                {scoreHistory.length >= 2 && (
                  <div className="flex items-center px-2.5 py-0.5 text-base font-semibold text-green-500">
                    {Math.round(
                      ((scoreHistory[0].score - scoreHistory[1].score) /
                        scoreHistory[1].score) *
                        100
                    )}
                    %
                    <svg
                      className="w-3 h-3 ms-1"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 14"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13V1m0 0L1 5m4-4 4 4"
                      />
                    </svg>
                  </div>
                )}
                {isHistoryLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
              {/* Chart Area */}
              {historyError ? (
                <p className="text-sm text-destructive">{historyError}</p>
              ) : scoreHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  まだスコア履歴がありません。練習を続けるとここにスコアが表示されます。
                </p>
              ) : (
                <>
                  <div className="relative h-64 w-full">
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <title>スコア推移グラフ</title>
                      {/* Grid lines */}
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
                      {/* Area fill */}
                      {scoreChartMetrics.points.length > 0 && (
                        <polygon
                          points={`0,100 ${scoreChartMetrics.polyline} 100,100`}
                          fill="currentColor"
                          fillOpacity="0.1"
                          className="text-primary"
                        />
                      )}
                      {/* Line */}
                      {scoreChartMetrics.points.length > 1 && (
                        <polyline
                          points={scoreChartMetrics.polyline}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.67"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        />
                      )}
                    </svg>
                    {/* Points - rendered as HTML to maintain circular shape */}
                    {scoreChartMetrics.points.map((point) => (
                      <div
                        key={`point-${point.sessionId}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      >
                        <div className="relative w-3 h-3">
                          <div className="absolute inset-0 rounded-full bg-primary" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      </div>
                    ))}
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
                    {/* クリック可能なポイント */}
                    <div className="absolute inset-0">
                      {scoreChartMetrics.points.map((point) => (
                        <button
                          key={`btn-${point.sessionId}`}
                          type="button"
                          className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          onClick={() => {
                            window.location.href = `/feedback?sessionId=${point.sessionId}`;
                          }}
                          aria-label={`セッション ${point.sessionId} のフィードバックを表示`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="grid grid-cols-1 items-center border-t border-border pt-5">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-muted-foreground inline-flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        過去 {scoreHistory.length} 回の練習
                      </div>
                      <Link
                        href="/simulation"
                        className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2 transition-colors"
                      >
                        練習を続ける
                        <svg
                          className="w-2.5 h-2.5 ms-1.5"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 6 10"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 9 4-4-4-4"
                          />
                        </svg>
                      </Link>
                    </div>
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
