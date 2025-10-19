import { MessageCircle, Sparkles, TrendingUp, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col relative">


			{/* Content with higher z-index */}
			<div className="relative z-10 min-h-screen flex flex-col">
				{/* Header (simulation と同じスタイルに合わせる) */}
				<header className="p-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
					<div className="w-24" /> {/* Left spacer to keep title centered */}
					<div className="flex items-center gap-2">
						<Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
						<span className="font-bold text-foreground text-lg">恋AI</span>
					</div>
					<div className="w-24" /> {/* Spacer for alignment */}
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
								<span style={{ color: '#ef5784ff' }}>AI女子と会話練習！</span> {/* #f7c6d5 */}
							</h2>
							<p className="text-xl text-foreground text-pretty max-w-2xl mx-auto drop-shadow">
								VTuberのようなAIアバターとのリアルタイム会話で、
								あなたのコミュニケーション能力を楽しく向上させましょう
							</p>
						</div>

						<div className="relative mt-12">
							{/* Avatar Image */}
							<div className="flex justify-center mb-8">
								<div className="relative w-80 h-80 md:w-96 md:h-96">
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
										今すぐ始める
									</Button>
								</Link>
							</div>

							{/* Feature Cards Below Button */}
							<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
								<Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
											<MessageCircle className="w-6 h-6 text-primary" />
										</div>
										<h3 className="text-lg font-semibold text-card-foreground mt-1">
											リアルタイム会話
										</h3>
									</div>
									<p className="text-muted-foreground text-sm mt-2">
										AIアバターと自然な会話を楽しみながら、コミュニケーションスキルを磨けます
									</p>
								</Card>

								<Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
											<TrendingUp className="w-6 h-6 text-accent" />
										</div>
										<h3 className="text-lg font-semibold text-card-foreground mt-1">
											的確なフィードバック
										</h3>
									</div>
									<p className="text-muted-foreground text-sm mt-2">
										会話終了後、AIが良かった点と改善点を分析してアドバイスします
									</p>
								</Card>

								<Card className="p-6 space-y-3 border-2 transition-colors bg-card/80 backdrop-blur-sm">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
											<Sparkles className="w-6 h-6 text-primary" />
										</div>
										<h3 className="text-lg font-semibold text-card-foreground mt-1">
											安心して練習
										</h3>
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
				<footer className="p-6 text-center text-muted-foreground text-sm">
					<p>
						© 2025 
						<Heart className="inline w-4 h-4 text-primary align-middle mx-2" />
            恋AI
						- JPHACKS 2025 Project
					</p>
				</footer>
			</div>
		</div>
	);
}
