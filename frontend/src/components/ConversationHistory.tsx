import { Heart, User, MessageCircle } from "lucide-react";
import type { Message } from "@/types/api";

interface ConversationHistoryProps {
  messages: Message[];
  className?: string;
}

export function ConversationHistory({
  messages,
  className = "",
}: ConversationHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto soft-shadow">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              まだ会話が始まっていません
            </p>
            <p className="text-muted-foreground text-xs">
              録音ボタンを押して話しかけてください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 overflow-y-auto p-4 ${className}`}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastMessage = index === messages.length - 1;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${
              isUser ? "flex-row" : "flex-row-reverse"
            } ${isLastMessage ? "animate-fade-in-up" : ""}`}
          >
            {/* Avatar Icon */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center soft-shadow ${
                isUser
                  ? "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
                  : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              }`}
            >
              {isUser ? (
                <User className="w-6 h-6" />
              ) : (
                <Heart className="w-6 h-6 fill-current" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`flex-1 max-w-[75%] p-4 rounded-3xl ${
                isUser ? "chat-bubble-user" : "chat-bubble"
              } soft-shadow`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`text-xs font-semibold ${
                    isUser ? "text-white/90" : "text-foreground"
                  }`}
                >
                  {isUser ? "あなた" : "AI女子"}
                </span>
                <span
                  className={`text-xs ${
                    isUser ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser ? "text-white" : "text-foreground"
                }`}
              >
                {message.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
