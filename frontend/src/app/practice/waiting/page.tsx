"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

type AvailablePartner = {
  id: string;
  name: string;
  rating?: number | null;
  isAvailable: boolean;
};

type MatchResult = {
  sessionId: string;
  roomId: string;
  partner: AvailablePartner;
};

const REFRESH_INTERVAL_MS = 20_000;

export default function PracticeWaitingPage() {
  const router = useRouter();
  const sessionState = useSession();
  const { data: sessionData, isPending } = sessionState;
  const user = sessionData?.user ?? null;
  const [partners, setPartners] = useState<AvailablePartner[]>([]);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [matchingPartnerId, setMatchingPartnerId] = useState<string | null>(
    null,
  );
  const [matchError, setMatchError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPartners = useCallback(async () => {
    setPartnersError(null);
    setIsLoadingPartners(true);
    try {
      const response = await fetch("/api/partners/available", {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("パートナー情報の取得に失敗しました。");
      }

      const data = (await response.json()) as {
        partners: AvailablePartner[];
      };
      setPartners(data.partners ?? []);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
      setPartnersError(
        error instanceof Error
          ? error.message
          : "パートナー情報の取得に失敗しました。",
      );
    } finally {
      setIsLoadingPartners(false);
    }
  }, []);

  useEffect(() => {
    void loadPartners();
    const timer = setInterval(() => {
      void loadPartners();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadPartners]);

  const handleSelectPartner = useCallback(
    async (partner: AvailablePartner) => {
      if (!user?.id) {
        setMatchError("マッチングにはログインが必要です。");
        router.push("/login");
        return;
      }

      setMatchError(null);
      setMatchingPartnerId(partner.id);

      try {
        const response = await fetch("/api/partners/sessions/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            partnerId: partner.id,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : "セッションの作成に失敗しました。";
          throw new Error(message);
        }

        const data = (await response.json()) as {
          sessionId: string;
          roomId: string;
        };

        setActiveMatch({
          sessionId: data.sessionId,
          roomId: data.roomId,
          partner,
        });

        try {
          const currentCount =
            parseInt(localStorage.getItem("practiceSessionCount") ?? "0", 10) ||
            0;
          localStorage.setItem(
            "practiceSessionCount",
            String(Math.min(currentCount + 1, 10)),
          );
        } catch {
          // ignore quota errors
        }
      } catch (error) {
        console.error("Failed to match partner:", error);
        setMatchError(
          error instanceof Error ? error.message : "マッチングに失敗しました。",
        );
      } finally {
        setMatchingPartnerId(null);
      }
    },
    [user?.id, router],
  );

  const handleCopySessionId = useCallback(async () => {
    if (!activeMatch) return;
    try {
      await navigator.clipboard.writeText(activeMatch.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  }, [activeMatch]);

  const handleResetMatch = () => {
    setActiveMatch(null);
    setMatchError(null);
  };

  const availableCount = useMemo(() => {
    return partners.filter((partner) => partner.isAvailable).length;
  }, [partners]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>セッション情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-2">
          <h2 className="text-2xl font-bold text-foreground">ログインが必要です</h2>
          <p className="text-sm text-muted-foreground">
            実践練習の待機ルームを利用するには、アカウントにログインしてください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button className="rounded-full px-6">ログインする</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="rounded-full px-6">
                ホームに戻る
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            練習ページに戻る
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-medium text-primary uppercase tracking-widest">
              Live Partner Queue
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              実践練習の待機ルーム
            </h1>
            <p className="text-muted-foreground">
              リアルパートナーを選択すると、同じセッションIDでビデオ通話が開始できます。
            </p>
          </div>

          <Card className="p-6 border-2 border-primary/20 bg-card/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 text-foreground">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-semibold">マッチングの流れ</p>
                  <p className="text-xs text-muted-foreground">
                    パートナーを選ぶとセッションIDが発行され、同じIDで双方が接続します。
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadPartners()}
                disabled={isLoadingPartners}
                className="rounded-full"
              >
                {isLoadingPartners ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    最新状況を取得
                  </>
                )}
              </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    待機中のパートナー
                  </p>
                  <p className="text-lg font-semibold">
                    {isLoadingPartners ? "-" : availableCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">平均待ち時間</p>
                  <p className="text-lg font-semibold">1-2分</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/80 px-4 py-3 bg-background/60">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">通話環境</p>
                  <p className="text-lg font-semibold">暗号化済み</p>
                </div>
              </div>
            </div>
          </Card>

          {matchError && (
            <Card className="p-4 border-red-500/40 bg-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600">
                  マッチングに失敗しました
                </p>
                <p className="text-sm text-red-500">{matchError}</p>
              </div>
            </Card>
          )}

          {activeMatch ? (
            <Card className="p-6 border-2 border-green-500/40 bg-green-500/10 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    マッチング完了
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {activeMatch.partner.name} さんと接続準備OK
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-background/70 px-4 py-3">
                  <p className="text-xs text-muted-foreground">セッションID</p>
                  <p className="font-semibold text-lg break-all">
                    {activeMatch.sessionId}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 px-2 py-1 rounded-full text-xs"
                    onClick={handleCopySessionId}
                  >
                    {copied ? "コピー済み" : "IDをコピー"}
                  </Button>
                </div>
                <div className="rounded-lg border border-border bg-background/70 px-4 py-3">
                  <p className="text-xs text-muted-foreground">ルームID</p>
                  <p className="font-semibold text-lg break-all">
                    {activeMatch.roomId}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 rounded-full"
                  size="lg"
                  onClick={() =>
                    router.push(`/session/${activeMatch.sessionId}?role=user`)
                  }
                >
                  <Video className="w-5 h-5 mr-2" />
                  通話を開始する
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleResetMatch}
                >
                  別のパートナーを選ぶ
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                このIDはパートナーページにも共有され、同じセッションIDで接続されます。
              </p>
            </Card>
          ) : (
            <Card className="p-6 border-2">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    待機中のパートナー
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    オンラインのパートナーから選んでください
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadPartners()}
                  disabled={isLoadingPartners}
                  className="rounded-full"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  再読み込み
                </Button>
              </div>

              {partnersError && (
                <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-600">
                  {partnersError}
                </div>
              )}

              {isLoadingPartners ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>パートナー一覧を読み込み中...</p>
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    現在待機中のパートナーはいません。
                  </p>
                  <p className="text-xs text-muted-foreground">
                    しばらく待ってから再読み込みしてください。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partners.map((partner) => (
                    <Card
                      key={partner.id}
                      className="p-4 border rounded-xl hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-lg text-foreground">
                            {partner.name}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                            <span>
                              {partner.rating
                                ? partner.rating.toFixed(1)
                                : "評価準備中"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            partner.isAvailable
                              ? "bg-green-500/10 text-green-600 border border-green-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {partner.isAvailable ? "待機中" : "離席中"}
                        </span>
                      </div>
                      <Button
                        className="w-full mt-4 rounded-full"
                        size="lg"
                        disabled={
                          !partner.isAvailable ||
                          matchingPartnerId === partner.id ||
                          matchingPartnerId !== null
                        }
                        onClick={() => handleSelectPartner(partner)}
                      >
                        {matchingPartnerId === partner.id ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            マッチング中...
                          </>
                        ) : (
                          <>
                            <Video className="w-5 h-5 mr-2" />
                            このパートナーと話す
                          </>
                        )}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
