import { Card } from "@/components/ui/card";
import { Heart, User } from "lucide-react";
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
			<div
				className={`flex items-center justify-center h-full ${className}`}
			>
				<div className="text-center space-y-2">
					<p className="text-muted-foreground text-sm">
						まだ会話が始まっていません
					</p>
					<p className="text-muted-foreground text-xs">
						録音ボタンを押して話しかけてください
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-3 overflow-y-auto ${className}`}>
			{messages.map((message, index) => {
				const isUser = message.role === "user";
				const isLastMessage = index === messages.length - 1;

				return (
					<div
						key={message.id}
						className={`flex gap-3 ${isUser ? "flex-row" : "flex-row-reverse"} ${
							isLastMessage ? "animate-fade-in" : ""
						}`}
					>
						{/* Avatar Icon */}
						<div
							className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
								isUser
									? "bg-primary/20 text-primary"
									: "bg-accent/20 text-accent"
							}`}
						>
							{isUser ? (
								<User className="w-5 h-5" />
							) : (
								<Heart className="w-5 h-5 fill-current" />
							)}
						</div>

						{/* Message Bubble */}
						<Card
							className={`flex-1 max-w-[80%] p-4 ${
								isUser
									? "bg-primary/10 border-primary/20"
									: "bg-accent/10 border-accent/20"
							}`}
						>
							<div className="flex items-start justify-between gap-2 mb-1">
								<span
									className={`text-xs font-semibold ${
										isUser ? "text-primary" : "text-accent"
									}`}
								>
									{isUser ? "あなた" : "AI女子"}
								</span>
								<span className="text-xs text-muted-foreground">
									{new Date(message.createdAt).toLocaleTimeString(
										"ja-JP",
										{
											hour: "2-digit",
											minute: "2-digit",
										},
									)}
								</span>
							</div>
							<p className="text-sm leading-relaxed whitespace-pre-wrap">
								{message.content}
							</p>
						</Card>
					</div>
				);
			})}
		</div>
	);
}
