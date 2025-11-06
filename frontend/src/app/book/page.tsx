"use client";

import { Calendar, Clock, Heart, Star, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

interface Partner {
	id: string;
	name: string;
	image: string | null;
	rating: number | null;
}

interface PracticeSlot {
	id: string;
	startTime: string;
	endTime: string;
	price: number;
	partner: Partner;
}

export default function BookPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [slots, setSlots] = useState<PracticeSlot[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

	const fetchAvailableSlots = useCallback(async () => {
		try {
			const response = await fetch("/api/partner/slots?status=available");
			const data = await response.json();
			setSlots(data.slots || []);
		} catch (error) {
			console.error("Failed to fetch slots:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAvailableSlots();
	}, [fetchAvailableSlots]);

	const handleBookSlot = async (slotId: string, price: number) => {
		try {
			if (!session?.user?.id) {
				alert("セッションが見つかりません");
				return;
			}

			setBookingSlotId(slotId);

			// Stripe Checkoutセッションを作成
			const checkoutResponse = await fetch("/api/payment/create-checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slotId,
					userId: session.user.id,
					price,
				}),
			});

			if (checkoutResponse.ok) {
				const { url } = await checkoutResponse.json();
				// Stripe Checkoutページにリダイレクト
				window.location.href = url;
			} else {
				const error = await checkoutResponse.json();
				alert(`予約の開始に失敗しました: ${error.error}`);
			}
		} catch (error) {
			console.error("Failed to start booking:", error);
			alert("エラーが発生しました");
		} finally {
			setBookingSlotId(null);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "short",
		});
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("ja-JP", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 日付でグループ化
	const slotsByDate = slots.reduce(
		(acc, slot) => {
			const date = formatDate(slot.startTime);
			if (!acc[date]) {
				acc[date] = [];
			}
			acc[date].push(slot);
			return acc;
		},
		{} as Record<string, PracticeSlot[]>,
	);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">
							セッション予約
						</span>
					</div>
					<Button variant="ghost" onClick={() => router.push("/")}>
						戻る
					</Button>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 p-4 sm:p-6">
				<div className="max-w-4xl mx-auto space-y-6">
					{/* Title */}
					<div className="space-y-2">
						<h1 className="text-3xl font-bold text-foreground">
							パートナーとの練習セッションを予約
						</h1>
						<p className="text-muted-foreground">
							実際のパートナーと会話練習ができる時間枠を選択してください
						</p>
					</div>

					{/* Loading State */}
					{isLoading && (
						<Card className="p-8 border-2">
							<div className="text-center space-y-4">
								<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
								<p className="text-muted-foreground">読み込み中...</p>
							</div>
						</Card>
					)}

					{/* Empty State */}
					{!isLoading && slots.length === 0 && (
						<Card className="p-8 border-2 border-dashed">
							<div className="text-center space-y-2">
								<Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
								<p className="text-muted-foreground">
									現在予約可能な時間枠がありません
								</p>
								<p className="text-sm text-muted-foreground">
									後ほど再度ご確認ください
								</p>
							</div>
						</Card>
					)}

					{/* Slots by Date */}
					{!isLoading &&
						Object.entries(slotsByDate).map(([date, dateSlots]) => (
							<div key={date} className="space-y-4">
								<div className="flex items-center gap-2">
									<Calendar className="w-5 h-5 text-primary" />
									<h2 className="text-xl font-bold text-foreground">{date}</h2>
								</div>

								<div className="grid grid-cols-1 gap-4">
									{dateSlots.map((slot) => (
										<Card
											key={slot.id}
											className="p-6 border-2 hover:border-primary/50 transition-colors"
										>
											<div className="flex items-center justify-between gap-4">
												<div className="flex items-center gap-4 flex-1">
													{/* Partner Info */}
													<div className="flex items-center gap-3">
														{slot.partner.image ? (
															<img
																src={slot.partner.image}
																alt={slot.partner.name}
																className="w-12 h-12 rounded-full object-cover"
															/>
														) : (
															<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
																<User className="w-6 h-6 text-primary" />
															</div>
														)}
														<div>
															<p className="font-semibold text-foreground">
																{slot.partner.name}
															</p>
															{slot.partner.rating && (
																<div className="flex items-center gap-1 text-sm text-muted-foreground">
																	<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
																	<span>{slot.partner.rating.toFixed(1)}</span>
																</div>
															)}
														</div>
													</div>

													{/* Time Info */}
													<div className="flex items-center gap-2 text-foreground">
														<Clock className="w-4 h-4" />
														<span className="font-medium">
															{formatTime(slot.startTime)} -{" "}
															{formatTime(slot.endTime)}
														</span>
													</div>

													{/* Price */}
													<div className="text-right">
														<p className="text-2xl font-bold text-primary">
															¥{slot.price.toLocaleString()}
														</p>
													</div>
												</div>

												{/* Book Button */}
												<Button
													onClick={() => handleBookSlot(slot.id, slot.price)}
													disabled={bookingSlotId === slot.id}
													size="lg"
												>
													{bookingSlotId === slot.id ? "処理中..." : "予約する"}
												</Button>
											</div>
										</Card>
									))}
								</div>
							</div>
						))}
				</div>
			</main>
		</div>
	);
}
