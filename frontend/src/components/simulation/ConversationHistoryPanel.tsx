import { MessageSquare, X } from "lucide-react";
import { memo } from "react";
import { ConversationHistory } from "@/components/ConversationHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Message } from "@/types/api";

const MemoizedConversationHistory = memo(ConversationHistory);

interface ConversationHistoryPanelProps {
	messages: Message[];
	showHistory: boolean;
	onToggleHistory: (show: boolean) => void;
	partnerName: string;
}

export function ConversationHistoryPanel({
	messages,
	showHistory,
	onToggleHistory,
	partnerName,
}: ConversationHistoryPanelProps) {
	return (
		<>
			{/* History Panel - Floating Bottom Right */}
			{showHistory && (
				<div className="absolute bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300">
					<Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl overflow-hidden">
						<div className="flex items-center justify-between p-4 border-b border-border/50">
							<div className="flex items-center gap-2">
								<MessageSquare className="w-5 h-5 text-primary" />
								<h3 className="font-semibold">会話履歴</h3>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => onToggleHistory(false)}
							>
								<X className="w-4 h-4" />
							</Button>
						</div>
						<div className="h-96 overflow-hidden">
							<MemoizedConversationHistory
								messages={messages}
								className="h-full p-4"
								partnerName={partnerName}
							/>
						</div>
					</Card>
				</div>
			)}

			{/* Toggle History Button - Floating Bottom Right (when history is hidden) */}
			{!showHistory && messages.length > 0 && (
				<Button
					variant="default"
					size="lg"
					className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs sm:text-sm md:text-base px-4 sm:px-6 py-2 sm:py-3"
					onClick={() => onToggleHistory(true)}
				>
					<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
					<span className="hidden sm:inline">
						話した内容 ({messages.length})
					</span>
					<span className="sm:hidden">履歴 ({messages.length})</span>
				</Button>
			)}
		</>
	);
}
