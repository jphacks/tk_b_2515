"use client";

import { loadStripe, type Stripe as StripeClient } from "@stripe/stripe-js";
import { CreditCard, Heart, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Stripeの公開可能キーを環境変数から取得
const stripePromise: Promise<StripeClient | null> = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

type StripeCheckoutClient = {
	redirectToCheckout: (options: {
		sessionId: string;
	}) => Promise<{ error?: { message?: string } }>;
};

export default function CheckoutPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const partnerId = searchParams.get("partnerId");
	const partnerName = searchParams.get("partnerName") || "パートナー";

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 価格設定（実際の価格）
	const sessionPrice = 1500; // 15分セッション: 1,500円

	const handleCheckout = async () => {
		if (!partnerId) {
			setError("パートナー情報が見つかりません");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// バックエンドにCheckoutセッションを作成
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-checkout-session`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						partnerId,
						partnerName,
						amount: sessionPrice,
					}),
				},
			);

			if (!response.ok) {
				throw new Error("チェックアウトセッションの作成に失敗しました");
			}

			const { sessionId } = await response.json();

			// Stripeチェックアウトページにリダイレクト
			const stripe = await stripePromise;

			if (!stripe) {
				setError("Stripeの初期化に失敗しました");
				setIsLoading(false);
				return;
			}

			const { error: stripeError } = await (
				stripe as unknown as StripeCheckoutClient
			).redirectToCheckout({
				sessionId,
			});

			if (stripeError) {
				throw new Error(stripeError.message);
			}
		} catch (err) {
			console.error("Checkout error:", err);
			setError(err instanceof Error ? err.message : "決済処理に失敗しました");
			setIsLoading(false);
		}
	};

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
				<div className="max-w-md w-full space-y-6">
					{/* Title */}
					<div className="text-center space-y-2">
						<CreditCard className="w-16 h-16 text-primary mx-auto" />
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
							お支払い
						</h1>
						<p className="text-muted-foreground">
							実践練習セッションのお支払い手続き
						</p>
					</div>

					{/* Payment Card */}
					<Card className="p-6 border-2">
						<div className="space-y-6">
							{/* Session Details */}
							<div className="space-y-4">
								<div className="flex items-center justify-between pb-4 border-b border-border">
									<span className="text-muted-foreground">パートナー</span>
									<span className="font-semibold text-foreground">
										{partnerName}
									</span>
								</div>

								<div className="flex items-center justify-between pb-4 border-b border-border">
									<span className="text-muted-foreground">セッション時間</span>
									<span className="font-semibold text-foreground">15分</span>
								</div>

								<div className="flex items-center justify-between pb-4 border-b border-border">
									<span className="text-muted-foreground">料金</span>
									<span className="font-semibold text-foreground">
										¥{sessionPrice.toLocaleString()}
									</span>
								</div>

								<div className="flex items-center justify-between pt-2">
									<span className="text-lg font-bold text-foreground">
										合計
									</span>
									<span className="text-2xl font-bold text-primary">
										¥{sessionPrice.toLocaleString()}
									</span>
								</div>
							</div>

							{/* Payment Info */}
							<div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
								<p className="text-sm text-muted-foreground">
									<strong>安全な決済:</strong>{" "}
									Stripeを使用した安全な決済処理です。
									クレジットカード情報は当サイトに保存されません。
								</p>
							</div>

							{/* Error Message */}
							{error && (
								<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
									<p className="text-sm text-red-600 dark:text-red-400">
										{error}
									</p>
								</div>
							)}

							{/* Checkout Button */}
							<Button
								onClick={handleCheckout}
								disabled={isLoading || !partnerId}
								size="lg"
								className="w-full rounded-full"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-5 h-5 mr-2 animate-spin" />
										処理中...
									</>
								) : (
									<>
										<CreditCard className="w-5 h-5 mr-2" />
										お支払いへ進む
									</>
								)}
							</Button>

							{/* Cancel Button */}
							<Button
								onClick={() => router.back()}
								disabled={isLoading}
								variant="outline"
								size="lg"
								className="w-full rounded-full"
							>
								キャンセル
							</Button>
						</div>
					</Card>

					{/* Security Notice */}
					<div className="text-center text-sm text-muted-foreground">
						<p>
							お支払い後、すぐにパートナーとのセッションが開始できます。
							<br />
							ご不明な点は
							<a href="/support" className="text-primary hover:underline">
								サポート
							</a>
							までお問い合わせください。
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
