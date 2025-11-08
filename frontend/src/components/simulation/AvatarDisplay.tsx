import { Heart } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ConversationAvatar = dynamic(
	() => import("@/components/Avatar/ConversationAvatar"),
	{
		ssr: false,
		loading: () => (
			<div className="w-full h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<Heart className="w-16 h-16 text-primary animate-pulse mx-auto" />
					<p className="text-muted-foreground">アバターを読み込み中...</p>
				</div>
			</div>
		),
	},
);

type GestureType = "idle" | "thinking" | "talking" | "peace" | "nodding";

interface AvatarDisplayProps {
	modelUrl: string;
	lipSyncValue: number;
	emotion: "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful";
	gesture: GestureType;
	avatarName?: string;
	backgroundSrc?: string;
}

export function AvatarDisplay({
	modelUrl,
	lipSyncValue,
	emotion,
	gesture,
	avatarName = "まき",
	backgroundSrc,
}: AvatarDisplayProps) {
	return (
		<div className="flex-1 relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl overflow-hidden border border-primary/20 shadow-2xl min-h-[480px] md:min-h-[640px] lg:min-h-[720px]">
			<div className="absolute inset-0">
				<Suspense
					fallback={
						<div className="w-full h-full flex items-center justify-center">
							<div className="text-center space-y-4">
								<Heart className="w-16 h-16 text-primary animate-pulse mx-auto" />
								<p className="text-muted-foreground">
									{avatarName}をよびだしちゅう...
								</p>
							</div>
						</div>
					}
				>
					<ConversationAvatar
						modelUrl={modelUrl}
						lipSyncValue={lipSyncValue}
						emotion={emotion}
						gesture={gesture}
						backgroundSrc={backgroundSrc}
						className="w-full h-full"
					/>
				</Suspense>
			</div>
			{/* AI Label */}
			<div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
				<p className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
					<Heart className="w-4 h-4 fill-current" />
					{avatarName}
				</p>
			</div>
		</div>
	);
}
