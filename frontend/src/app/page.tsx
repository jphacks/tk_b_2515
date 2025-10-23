import Link from "next/link";
import Image from "next/image";
import { Heart, Sparkles, MessageCircle, TrendingUp, Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Content with higher z-index */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <header className="h-[6vh] px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
          {/* Left: icon */}
          <div className="w-24 flex items-center justify-center h-full">
            <Link href="/" className="relative h-[100%] w-[100%] block">
              <Image
                src="/a.png"
                alt="恋AIのアイコン"
                fill
                className="object-cover rounded-full"
              />
            </Link>
          </div>

          {/* Center: title */}
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
            <span className="font-bold text-foreground text-lg">恋AI</span>
          </div>

          {/* Right: Home button */}
          <div className="w-24 flex items-center justify-center">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-primary/10"
              >
                ホーム
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-6xl w-full text-center space-y-8">
            {/* Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/90 backdrop-blur-sm rounded-full text-secondary-foreground text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AIコミュニケーション・コーチング
              </div>
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-balance drop-shadow-lg sparkle-text">
                <span style={{ color: "#ef5784ff" }}>
                  女子と話せるようになろう!!
                </span>
              </h2>
              <p className="text-xl text-foreground text-pretty max-w-2xl mx-auto drop-shadow">
                バーチャル女子大生"まき"との会話で、きみのコミュ力爆上げしちゃおう!
              </p>
            </div>

            {/* Avatar & Button */}
            <div className="relative mt-12">
              <div className="flex justify-center mb-8">
                <div className="relative w-72 h-72 md:w-96 md:h-96">
                  <Image
                    src="/IMG_8059.webp"
                    alt="恋AI アバター"
                    fill
                    className="object-cover rounded-full drop-shadow-2xl border-4 border-primary/20"
                    priority
                  />
                </div>
              </div>

              <div className="flex justify-center mb-12">
                <Link href="/simulation">
                  <Button
                    size="lg"
                    className="rounded-full text-2xl px-16 py-10 shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all font-bold animate-wiggle heart-effect"
                  >
                    <MessageCircle className="w-8 h-8 mr-3" />
                    今すぐはなしかける
                  </Button>
                </Link>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mt-1">リアルタイム会話</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    "まき"と自然な会話を楽しみながら、コミュニケーションスキルを磨けます
                  </p>
                </Card>

                <Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold mt-1">的確なフィードバック</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    会話終了後、AIが良かった点と改善点をフィードバックします
                  </p>
                </Card>

                <Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mt-1">安心して練習</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    匿名で利用可能。失敗を恐れず、何度でも練習できる安全な環境です
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-[6vh] flex items-center justify-center text-muted-foreground text-sm border-t border-border/50 bg-card/50 backdrop-blur-md">
          <p>
            © 2025
            <Heart className="inline w-4 h-4 text-primary align-middle mx-2" />
            恋AI - JPHACKS 2025 Project
          </p>
        </footer>
      </div>
    </div>
  );
}
