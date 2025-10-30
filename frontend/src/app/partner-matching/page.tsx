"use client";

import { Heart, Users, ArrowLeft, Clock, Star, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function PartnerMatchingPage() {
  const router = useRouter();
  const [availablePartners, setAvailablePartners] = useState<Array<{
    id: string;
    name: string;
    age: number;
    university: string;
    rating: number;
    photoUrl?: string;
  }>>([]);

  // TODO: 利用可能なパートナーをAPIから取得
  useEffect(() => {
    const fetchPartners = async () => {
      // Mock data
      setAvailablePartners([
        {
          id: "partner1",
          name: "まゆ",
          age: 20,
          university: "慶應義塾大学",
          rating: 4.8,
        },
        {
          id: "partner2",
          name: "さくら",
          age: 21,
          university: "早稲田大学",
          rating: 4.9,
        },
        {
          id: "partner3",
          name: "ゆい",
          age: 19,
          university: "上智大学",
          rating: 4.7,
        },
      ]);
    };

    fetchPartners();
  }, []);

  const handleStartMatching = (partnerId: string, partnerName: string) => {
    // 支払いページへ遷移
    router.push(`/payment/checkout?partnerId=${partnerId}&partnerName=${encodeURIComponent(partnerName)}`);
  };
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-card/50 backdrop-blur-sm border-b border-border">
        <Link href="/feedback">
          <Button variant="ghost" size="sm" className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="font-semibold text-foreground">恋ai</span>
        </div>
        <div className="w-20" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-4xl w-full space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              実践練習
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              実際の女の子とビデオ通話で会話練習
            </p>
          </div>

          {/* Info Card */}
          <Card className="p-6 sm:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Users className="w-16 h-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">
                  実践練習とは？
                </h2>
                <p className="text-muted-foreground">
                  AIアバターでの練習後、実際の女の子とビデオ通話で<br />
                  リアルな会話練習ができます
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                  <Clock className="w-8 h-8 text-primary mx-auto" />
                  <h3 className="font-semibold">15分セッション</h3>
                  <p className="text-sm text-muted-foreground">
                    1回15分の会話練習
                  </p>
                </div>
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                  <Heart className="w-8 h-8 text-primary mx-auto" />
                  <h3 className="font-semibold">優しいサポート</h3>
                  <p className="text-sm text-muted-foreground">
                    親切な女の子が<br />丁寧に対応
                  </p>
                </div>
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                  <Star className="w-8 h-8 text-primary mx-auto" />
                  <h3 className="font-semibold">AIフィードバック</h3>
                  <p className="text-sm text-muted-foreground">
                    終了後にAIが<br />詳細分析
                  </p>
                </div>
              </div>

              {/* Available Partners */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground text-center">
                  対応可能なパートナー
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availablePartners.map((partner) => (
                    <Card
                      key={partner.id}
                      className="p-4 border-2 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleStartMatching(partner.id, partner.name)}
                    >
                      <div className="space-y-3">
                        {/* Profile Picture */}
                        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="text-center space-y-1">
                          <h4 className="font-bold text-foreground">
                            {partner.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {partner.age}歳 • {partner.university}
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">
                              {partner.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button
                          className="w-full rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartMatching(partner.id, partner.name);
                          }}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          通話を開始
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/simulation" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full rounded-full">
                    AIとの練習を続ける
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    ホームに戻る
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
