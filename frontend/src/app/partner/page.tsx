"use client";

import { Heart, Users, Calendar, TrendingUp, Settings, Video, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PartnerDashboardPage() {
  const router = useRouter();

  // TODO: 実際のセッションデータをAPIから取得
  const mockStats = {
    totalSessions: 0,
    todaySessions: 0,
    rating: 0,
    earnings: 0,
  };

  // TODO: 実際の待機中セッションをAPIから取得
  const activeSessions = [
    {
      id: "session-active-123",
      userName: "田中太郎", // 男性ユーザーの名前
      scheduledAt: "2025-10-28T10:00:00Z",
    },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">恋ai パートナー</span>
          </div>
          <Link href="/partner/settings">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              パートナーダッシュボード
            </h1>
            <p className="text-muted-foreground">
              会話練習のサポートとセッション管理
            </p>
          </div>

          {/* Active Sessions Alert */}
          {activeSessions.length > 0 && (
            <Card className="p-6 border-2 border-green-500/50 bg-green-500/5">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Video className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-foreground">
                    待機中のセッション
                  </h2>
                </div>
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {session.userName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(session.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/partner-call/${session.id}`)}
                        className="bg-green-600 hover:bg-green-700 rounded-full"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        参加する
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">総セッション数</p>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {mockStats.totalSessions}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">今日のセッション</p>
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {mockStats.todaySessions}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">評価</p>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {mockStats.rating > 0 ? mockStats.rating.toFixed(1) : "-"}
                  <span className="text-lg text-muted-foreground">/5.0</span>
                </p>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">獲得ポイント</p>
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {mockStats.earnings}
                </p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/partner/sessions">
              <Card className="p-6 border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="space-y-3">
                  <Calendar className="w-10 h-10 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">
                    セッション管理
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    予定されているセッションの確認と管理
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/partner/profile">
              <Card className="p-6 border-2 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="space-y-3">
                  <Settings className="w-10 h-10 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">
                    プロフィール設定
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    プロフィールと対応可能時間の設定
                  </p>
                </div>
              </Card>
            </Link>
          </div>

          {/* Getting Started */}
          <Card className="p-6 sm:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                パートナーとして始める
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">プロフィールを設定</h4>
                    <p className="text-sm text-muted-foreground">
                      自己紹介と写真を追加して、魅力的なプロフィールを作成しましょう
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">対応可能時間を設定</h4>
                    <p className="text-sm text-muted-foreground">
                      あなたの都合の良い時間帯を設定してください
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">セッションを開始</h4>
                    <p className="text-sm text-muted-foreground">
                      準備ができたら、会話練習のサポートを開始できます
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/partner/profile">
                  <Button size="lg" className="rounded-full">
                    プロフィールを設定する
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
