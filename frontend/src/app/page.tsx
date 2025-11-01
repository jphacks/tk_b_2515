"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Earth,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Content with higher z-index */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 sm:h-20 px-3 sm:px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
          {/* Left: icon */}
          <div className="w-12 sm:w-16 md:w-20 flex items-center justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="relative h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="ページを更新"
            >
              <Image
                src="/a.png"
                alt="恋AIのアイコン"
                fill
                className="object-contain"
              />
            </button>
          </div>

          {/* Center: title */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-pulse" />
            <span className="font-bold text-foreground text-base sm:text-lg">恋AI</span>
          </div>

          {/* Right: Home button */}
          <div className="w-12 sm:w-16 md:w-20 flex items-center justify-center">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-primary/10 flex items-center px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Earth className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">言語選択</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-6xl w-full text-center space-y-6 sm:space-y-8">
            {/* Title */}
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary/90 backdrop-blur-sm rounded-full text-secondary-foreground text-xs sm:text-sm font-medium">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                AIコミュニケーション・コーチング
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-balance drop-shadow-lg sparkle-text px-2">
                <span style={{ color: "#ef5784ff" }}>
                  女子と話せるようになろう!!
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground text-pretty max-w-2xl mx-auto drop-shadow px-4">
                バーチャル女子大生"まき"との会話で、きみのコミュ力爆上げしちゃおう!
              </p>
            </div>

            {/* Avatar & Button */}
            <div className="relative mt-6 sm:mt-8 md:mt-12">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                  <Image
                    src="/maki.webp"
                    alt="恋AI アバター"
                    fill
                    className="object-cover rounded-full drop-shadow-2xl border-2 sm:border-4 border-primary/20"
                    priority
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                <Link href="/simulation" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full text-base sm:text-xl md:text-2xl px-8 sm:px-12 md:px-16 py-6 sm:py-8 md:py-10 shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all font-bold animate-wiggle heart-effect"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-3" />
                    今すぐはなしかける
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto rounded-full text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 hover:bg-primary/10"
                  >
                    ログインして続ける
                  </Button>
                </Link>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-2">
                <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mt-1">
                      リアルタイム会話
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                    "まき"と自然な会話を楽しみながら、コミュニケーションスキルを磨けます
                  </p>
                </Card>

                <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mt-1">
                      的確なフィードバック
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                    会話終了後、AIが良かった点と改善点をフィードバックします
                  </p>
                </Card>

                <Card className="p-4 sm:p-6 space-y-2 sm:space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm sm:col-span-2 md:col-span-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mt-1">安心して練習</h3>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                    匿名で利用可能。失敗を恐れず、何度でも練習できる安全な環境です
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-14 sm:h-16 flex items-center justify-center text-muted-foreground text-xs sm:text-sm border-t border-border/50 bg-card/50 backdrop-blur-md px-4">
          <p className="text-center">
            © 2025
            <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-primary align-middle mx-1 sm:mx-2" />
            <span className="hidden sm:inline">恋AI - JPHACKS 2025 Projected by 調布恋AI連合</span>
            <span className="sm:hidden">恋AI</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
