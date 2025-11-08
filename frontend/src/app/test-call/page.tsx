/**
 * WebRTCテストページ
 *
 * ビデオ通話機能をテストするためのページです。
 * ユーザーとパートナーの2つの役割で同時に接続してテストできます。
 *
 * 使い方：
 * 1. 「ユーザーとして参加」をクリック
 * 2. 「パートナーとして参加」をクリック（新しいウィンドウが開く）
 * 3. 両方のウィンドウでカメラ・マイクを許可
 * 4. 自動的にWebRTC接続が確立されます
 */
"use client";

import { Heart, Video, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestCallPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(`test-session-${Date.now()}`);
  const [userConnected, setUserConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);

  const endCall = useCallback(() => {
    // 接続終了を他ウィンドウへ通知
    try {
      localStorage.setItem(`webrtc_end_${sessionId}`, String(Date.now()));
    } catch {
      /* ignore */
    }
    // 接続終了時はホームへ戻る（フィードバック生成は行わない）
    router.push("/");
  }, [router, sessionId]);

  // 他ウィンドウの接続状態（localStorage経由）を監視
  useEffect(() => {
    const keyUser = `webrtc_connected_${sessionId}_user`;
    const keyPartner = `webrtc_connected_${sessionId}_partner`;

    const readState = () => {
      try {
        setUserConnected(localStorage.getItem(keyUser) === "true");
        setPartnerConnected(localStorage.getItem(keyPartner) === "true");
      } catch {
        /* ignore */
      }
    };

    readState();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === keyUser || e.key === keyPartner) {
        readState();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [sessionId]);

  // 両者接続後に 5 分カウントダウン開始
  useEffect(() => {
    if (!timerStarted && userConnected && partnerConnected) {
      setSecondsRemaining(300); // 5分
      setTimerStarted(true);
    }
  }, [userConnected, partnerConnected, timerStarted]);

  // カウントダウン進行
  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      endCall();
      return;
    }
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSecondsRemaining((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [secondsRemaining, endCall]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const joinAsUser = () => {
    // 新しいウィンドウで開き、ダッシュボード（このページ）は残す
    window.open(`/session/${sessionId}?role=user`, "_blank");
  };

  const joinAsPartner = () => {
    window.open(`/session/${sessionId}?role=partner`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Heart className="w-12 h-12 text-primary fill-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            WebRTC通話テスト
          </h1>
          <p className="text-muted-foreground">開発者向けのテストページです</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              セッションID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="test-session-123"
            />
            <p className="text-xs text-muted-foreground">
              両方のブラウザで同じセッションIDを使用してください
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-foreground">テスト方法:</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>手順:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>「ユーザーとして参加」をクリック</li>
                <li>
                  「パートナーとして参加」をクリック（新しいウィンドウが開く）
                </li>
                <li>
                  両ウィンドウで接続処理完了後、自動的にカウントダウン開始
                </li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={joinAsUser} size="lg" className="w-full">
              <Video className="w-5 h-5 mr-2" />
              ユーザーとして参加
            </Button>
            <Button
              onClick={joinAsPartner}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Video className="w-5 h-5 mr-2" />
              パートナーとして参加（新しいウィンドウ）
            </Button>
          </div>

          <Card className="p-4 border border-primary/30 bg-primary/5 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> 接続状態
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`rounded-md px-2 py-2 border ${
                  userConnected
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : "border-border text-muted-foreground"
                }`}
              >
                ユーザー: {userConnected ? "接続" : "未接続"}
              </div>
              <div
                className={`rounded-md px-2 py-2 border ${
                  partnerConnected
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : "border-border text-muted-foreground"
                }`}
              >
                パートナー: {partnerConnected ? "接続" : "未接続"}
              </div>
            </div>
            {!timerStarted && (
              <p className="text-xs text-muted-foreground">
                両方が接続すると5分タイマーが開始します。
              </p>
            )}
            {timerStarted && secondsRemaining !== null && (
              <div className="text-center">
                <p className="text-sm font-medium">
                  残り時間:{" "}
                  <span
                    className={`font-bold ${
                      secondsRemaining <= 30
                        ? "text-red-600 animate-pulse"
                        : "text-foreground"
                    }`}
                  >
                    {formatTime(secondsRemaining)}
                  </span>
                </p>
                <Button
                  onClick={endCall}
                  size="sm"
                  variant="outline"
                  className="mt-2"
                >
                  会話を終了する
                </Button>
              </div>
            )}
          </Card>

          <div className="pt-2 border-t border-border">
            <h3 className="font-semibold text-foreground mb-2">確認項目:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 両方の画面で接続が「接続」になるか</li>
              <li>✓ 接続後に5分タイマーが開始されるか</li>
              <li>✓ タイマー終了または終了ボタンでホームへ戻るか</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
