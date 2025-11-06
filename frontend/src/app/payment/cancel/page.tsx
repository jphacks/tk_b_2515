"use client";

import { Heart, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentCancelPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-6xl mx-auto flex items-center justify-center">
					<div className="flex items-center gap-2">
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">恋ai</span>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center p-4 sm:p-6">
				<div className="max-w-md w-full">
					<Card className="p-8 border-2 border-yellow-500/20">
						<div className="space-y-6 text-center">
							<div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
								<XCircle className="w-10 h-10 text-yellow-500" />
							</div>

							<div>
								<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
									お支払いがキャンセルされました
								</h1>
								<p className="text-muted-foreground">
									決済処理が中断されました
								</p>
							</div>

							<div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
								<p className="text-sm text-muted-foreground">
									お支払いをキャンセルしました。
									<br />
									もう一度お試しいただくか、別のパートナーをお選びください。
								</p>
							</div>

							<div className="space-y-3">
								<Button
									onClick={() => router.push("/partner-matching")}
									size="lg"
									className="w-full rounded-full"
								>
									マッチングページに戻る
								</Button>

								<Button
									onClick={() => router.push("/")}
									variant="outline"
									size="lg"
									className="w-full rounded-full"
								>
									ホームに戻る
								</Button>
							</div>
						</div>
					</Card>
				</div>
			</main>
		</div>
	);
}
