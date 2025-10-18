import { MessageCircle, Sparkles, TrendingUp, Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative gradient-pink">
      {/* Background Image with softer overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.png"
          alt="Background"
          fill
          className="object-cover opacity-20"
          priority
          quality={100}
        />
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-primary/10" />
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center soft-shadow">
              <Heart className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              <span className="text-primary">恋</span>AI
            </h1>
          </div>
          <Button variant="outline" size="lg" className="heart-effect">
            <Star className="w-5 h-5 mr-2" />
            ログイン
          </Button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="max-w-6xl w-full text-center space-y-12">
            {/* Title */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm rounded-full text-foreground text-sm font-medium border border-primary/20 soft-shadow">
                <Sparkles className="w-5 h-5 text-primary" />
                AIコミュニケーション・コーチング
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-balance sparkle-text">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI女子と会話練習！
                </span>
              </h2>
              <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
                VTuberのようなAIアバターとのリアルタイム会話で、
                <br />
                あなたのコミュニケーション能力を楽しく向上させましょう
              </p>
            </div>

            <div className="relative mt-16">
              {/* Avatar Image */}
              <div className="flex justify-center mb-12">
                <div className="relative w-80 h-80 md:w-96 md:h-96 animate-gentle-bounce">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-110" />
                  <Image
                    src="/avatar.png"
                    alt="恋AI アバター"
                    fill
                    className="object-cover rounded-full soft-shadow-lg border-4 border-primary/30 relative z-10"
                    priority
                  />
                  {/* Floating hearts around avatar */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center soft-shadow animate-soft-pulse">
                    <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                  </div>
                  <div
                    className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center soft-shadow animate-soft-pulse"
                    style={{ animationDelay: "1s" }}
                  >
                    <Sparkles className="w-3 h-3 text-accent-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-16">
                <Link href="/simulation">
                  <Button
                    size="xl"
                    className="heart-effect animate-gentle-bounce"
                  >
                    <MessageCircle className="w-6 h-6 mr-3" />
                    今すぐ始める
                  </Button>
                </Link>
              </div>

              {/* Feature Cards Below Button */}
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card
                  className="group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground">
                      リアルタイム会話
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      AIアバターと自然な会話を楽しみながら、コミュニケーションスキルを磨けます
                    </p>
                  </div>
                </Card>

                <Card
                  className="group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground">
                      的確なフィードバック
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      会話終了後、AIが良かった点と改善点を分析してアドバイスします
                    </p>
                  </div>
                </Card>

                <Card
                  className="group hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-card-foreground">
                      安心して練習
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      匿名で利用可能。失敗を恐れず、何度でも練習できる安全な環境です
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-primary fill-current" />
            <p className="text-sm font-medium">
              © 2025 恋AI - JPHACKS 2025 Project
            </p>
          </div>
          <p className="text-xs opacity-75">
            AI女子との会話で、あなたのコミュニケーション能力を向上させましょう
          </p>
        </footer>
      </div>
    </div>
  );
}
