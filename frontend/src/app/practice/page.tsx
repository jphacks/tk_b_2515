"use client";

import { Heart, Target, Users, Zap, TrendingUp, Video, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PracticePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">恋ai</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
              会話力を高める<br />2つの練習方法
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              AIとの基礎練習から、実際の女性との実践練習まで。<br />
              あなたのペースで、確実にコミュニケーション力を向上させます。
            </p>
          </div>

          {/* Practice Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Practice */}
            <Card className="p-8 border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">AI練習</h2>
                    <p className="text-sm text-muted-foreground">基礎から学ぶ</p>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  AIアバター「まきちゃん」との会話練習。<br />
                  リアルタイムフィードバックで、基礎からしっかり学べます。
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">何度でも繰り返し練習できる</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">リアルタイムで表情・視線分析</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">詳細なフィードバックレポート</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">完全無料で利用可能</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-blue-500">無料</p>
                    <p className="text-xs text-muted-foreground">何度でも</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">10分</p>
                    <p className="text-xs text-muted-foreground">1セッション</p>
                  </div>
                </div>

                <Link href="/simulation">
                  <Button size="lg" className="w-full rounded-full bg-blue-500 hover:bg-blue-600">
                    AI練習を始める
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Real Practice */}
            <Card className="p-8 border-2 border-green-500/50 bg-gradient-to-br from-green-500/5 to-accent/5 hover:border-green-500 transition-all hover:shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">実践練習</h2>
                    <p className="text-sm text-green-600">おすすめ</p>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  実際の女性とビデオ通話で会話練習。<br />
                  AIでは得られない、リアルな経験を積めます。
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">実際の女性との会話体験</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">優しく丁寧にサポート</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">AIフィードバック付き</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">好きな時間に予約可能</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-2xl font-bold text-green-500">¥1,500</p>
                    <p className="text-xs text-muted-foreground">1セッション</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">15分</p>
                    <p className="text-xs text-muted-foreground">1セッション</p>
                  </div>
                </div>

                <Link href="/partner-matching">
                  <Button size="lg" className="w-full rounded-full bg-green-600 hover:bg-green-700">
                    実践練習を始める
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="p-8 border-2">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground text-center">
                おすすめの練習ステップ
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-blue-500">1</span>
                  </div>
                  <h3 className="font-bold text-foreground">AI練習で基礎固め</h3>
                  <p className="text-sm text-muted-foreground">
                    まずはAIとの練習で、視線の合わせ方や笑顔の作り方など、基礎を学びましょう。
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-green-500">2</span>
                  </div>
                  <h3 className="font-bold text-foreground">実践練習で経験を積む</h3>
                  <p className="text-sm text-muted-foreground">
                    スコアが70点以上になったら、実際の女性との会話にチャレンジ！
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-bold text-foreground">自信を持って実生活へ</h3>
                  <p className="text-sm text-muted-foreground">
                    フィードバックを活かして、実際のデートやコミュニケーションに活かしましょう。
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-2">
              <div className="flex items-start gap-4">
                <Target className="w-10 h-10 text-primary flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">具体的なフィードバック</h3>
                  <p className="text-sm text-muted-foreground">
                    AIが表情、視線、会話内容を分析。改善点を具体的に提示します。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-10 h-10 text-primary flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">成長が見える</h3>
                  <p className="text-sm text-muted-foreground">
                    練習の履歴やスコアの推移をグラフで確認。成長を実感できます。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="flex items-start gap-4">
                <Video className="w-10 h-10 text-primary flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">いつでもどこでも</h3>
                  <p className="text-sm text-muted-foreground">
                    スマホやPCから、好きな時間に練習できます。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2">
              <div className="flex items-start gap-4">
                <Heart className="w-10 h-10 text-primary flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground">安心・安全</h3>
                  <p className="text-sm text-muted-foreground">
                    プライバシー保護を徹底。実践練習の相手も厳選された女性のみ。
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground">
                今すぐ始めよう
              </h2>
              <p className="text-muted-foreground">
                まずは無料のAI練習から始めて、基礎を固めましょう。<br />
                準備ができたら実践練習にステップアップ！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/simulation">
                  <Button size="lg" className="rounded-full min-w-[200px]">
                    AI練習を始める
                  </Button>
                </Link>
                <Link href="/partner-matching">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full min-w-[200px]"
                  >
                    実践練習を見る
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
