"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Mic, MicOff, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SimulationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  const handleStartConversation = () => {
    setConversationStarted(true);
    setIsRecording(true);
  };

  const handleEndConversation = () => {
    // Navigate to feedback page
    window.location.href = "/feedback";
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

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
        <div className="max-w-2xl w-full space-y-8">
          {!conversationStarted ? (
            <>
              {/* Initial State */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground">
                  会話シミュレーション
                </h1>
                <p className="text-muted-foreground text-lg">
                  AIと会話の練習をしましょう
                </p>
              </div>

              <Card className="p-12 text-center border-2 space-y-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Heart className="w-16 h-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">
                    準備はできましたか？
                  </h2>
                  <p className="text-muted-foreground">
                    ボタンを押して会話を始めましょう
                  </p>
                </div>
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={handleStartConversation}
                >
                  会話を始める
                </Button>
              </Card>
            </>
          ) : (
            <>
              {/* Recording State */}
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-foreground">
                  会話中...
                </h1>
                <p className="text-muted-foreground">
                  AIの話を聞いて、自然に会話してみましょう
                </p>
              </div>

              <Card className="p-12 text-center border-2 space-y-8">
                {/* Animated Microphone */}
                <div className="relative w-40 h-40 mx-auto">
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isRecording ? (
                      <Mic className="w-20 h-20 text-primary" />
                    ) : (
                      <MicOff className="w-20 h-20 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-foreground">
                    {isRecording ? "録音中..." : "一時停止中"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRecording
                      ? "話している内容が記録されています"
                      : "録音が一時停止されています"}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    variant={isRecording ? "secondary" : "default"}
                    className="rounded-full"
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        一時停止
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        再開
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full"
                    onClick={handleEndConversation}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    会話を終了
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
