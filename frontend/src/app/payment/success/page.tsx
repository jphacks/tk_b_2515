"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [isVerifying, setIsVerifying] = useState(true);
  const [partnerSessionId, setPartnerSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("セッション情報が見つかりません");
        setIsVerifying(false);
        return;
      }

      try {
        // 支払いを確認してパートナーセッションを作成
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        if (!response.ok) {
          throw new Error("支払いの確認に失敗しました");
        }

        const data = await response.json();
        setPartnerSessionId(data.partnerSessionId);
        setIsVerifying(false);
      } catch (err) {
        console.error("Payment verification error:", err);
        setError(
          err instanceof Error ? err.message : "支払いの確認に失敗しました"
        );
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handleStartSession = () => {
    if (partnerSessionId) {
      router.push(`/partner-call/${partnerSessionId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">恋ai</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-6">
          {isVerifying ? (
            <Card className="p-8 border-2 text-center">
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                <h2 className="text-xl font-bold text-foreground">
                  お支払いを確認中...
                </h2>
                <p className="text-muted-foreground">
                  少々お待ちください
                </p>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-8 border-2 border-red-500/20">
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    エラーが発生しました
                  </h1>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button
                  onClick={() => router.push("/partner-matching")}
                  size="lg"
                  className="w-full rounded-full"
                >
                  マッチングページに戻る
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Success Message */}
              <Card className="p-8 border-2 border-green-500/20">
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      お支払いが完了しました！
                    </h1>
                    <p className="text-muted-foreground">
                      パートナーとのセッションを開始できます
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      セッションIDが作成されました。
                      <br />
                      準備ができたら「セッションを開始」をクリックしてください。
                    </p>
                  </div>

                  <Button
                    onClick={handleStartSession}
                    size="lg"
                    className="w-full rounded-full"
                  >
                    セッションを開始
                  </Button>

                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full"
                  >
                    ホームに戻る
                  </Button>
                </div>
              </Card>

              {/* Receipt Info */}
              <Card className="p-6 border-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">
                    領収書について
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    領収書はご登録のメールアドレスに送信されました。
                    <br />
                    マイページの「利用履歴」からもダウンロードできます。
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
