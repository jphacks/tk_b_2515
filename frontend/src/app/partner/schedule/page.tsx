"use client";

import { Calendar, Clock, Heart, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TimeSlot {
	date: string;
	startTime: string;
	endTime: string;
	price: number;
}

export default function PartnerSchedulePage() {
	const router = useRouter();
	const [slots, setSlots] = useState<TimeSlot[]>([]);
	const [newSlot, setNewSlot] = useState<TimeSlot>({
		date: "",
		startTime: "",
		endTime: "",
		price: 1000,
	});

	const handleAddSlot = () => {
		if (newSlot.date && newSlot.startTime && newSlot.endTime) {
			setSlots([...slots, { ...newSlot }]);
			setNewSlot({
				date: "",
				startTime: "",
				endTime: "",
				price: 1000,
			});
		}
	};

	const handleRemoveSlot = (index: number) => {
		setSlots(slots.filter((_, i) => i !== index));
	};

	const handleSubmit = async () => {
		try {
			const response = await fetch("/api/partner/slots", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slots }),
			});

			if (response.ok) {
				alert("スケジュールを登録しました！");
				setSlots([]);
				router.push("/partner");
			} else {
				const error = await response.json();
				alert(`スケジュールの登録に失敗しました: ${error.error}`);
			}
		} catch (error) {
			console.error("Failed to submit schedule:", error);
			alert("エラーが発生しました");
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<span className="font-semibold text-foreground">
							スケジュール登録
						</span>
					</div>
					<Button variant="ghost" onClick={() => router.push("/partner")}>
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
							対応可能な時間枠を登録
						</h1>
						<p className="text-muted-foreground">
							ユーザーが予約できる時間枠を設定してください
						</p>
					</div>

					{/* Add New Slot Form */}
					<Card className="p-6 border-2">
						<div className="space-y-4">
							<h2 className="text-xl font-bold text-foreground flex items-center gap-2">
								<Plus className="w-5 h-5" />
								新しい時間枠を追加
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Date */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground flex items-center gap-2">
										<Calendar className="w-4 h-4" />
										日付
									</label>
									<input
										type="date"
										value={newSlot.date}
										onChange={(e) =>
											setNewSlot({ ...newSlot, date: e.target.value })
										}
										className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>

								{/* Price */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground">
										料金（円）
									</label>
									<input
										type="number"
										value={newSlot.price}
										onChange={(e) =>
											setNewSlot({
												...newSlot,
												price: parseInt(e.target.value, 10),
											})
										}
										min={500}
										step={100}
										className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>

								{/* Start Time */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground flex items-center gap-2">
										<Clock className="w-4 h-4" />
										開始時刻
									</label>
									<input
										type="time"
										value={newSlot.startTime}
										onChange={(e) =>
											setNewSlot({ ...newSlot, startTime: e.target.value })
										}
										className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>

								{/* End Time */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-foreground flex items-center gap-2">
										<Clock className="w-4 h-4" />
										終了時刻
									</label>
									<input
										type="time"
										value={newSlot.endTime}
										onChange={(e) =>
											setNewSlot({ ...newSlot, endTime: e.target.value })
										}
										className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
							</div>

							<Button onClick={handleAddSlot} className="w-full" size="lg">
								<Plus className="w-5 h-5 mr-2" />
								時間枠を追加
							</Button>
						</div>
					</Card>

					{/* Slots List */}
					{slots.length > 0 && (
						<Card className="p-6 border-2">
							<div className="space-y-4">
								<h2 className="text-xl font-bold text-foreground">
									登録予定の時間枠（{slots.length}件）
								</h2>

								<div className="space-y-3">
									{slots.map((slot, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-4 bg-muted rounded-lg"
										>
											<div className="space-y-1">
												<p className="font-semibold text-foreground">
													{new Date(slot.date).toLocaleDateString("ja-JP", {
														year: "numeric",
														month: "long",
														day: "numeric",
														weekday: "short",
													})}
												</p>
												<p className="text-sm text-muted-foreground">
													{slot.startTime} - {slot.endTime} （¥{slot.price}）
												</p>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRemoveSlot(index)}
												className="text-destructive hover:text-destructive hover:bg-destructive/10"
											>
												<X className="w-5 h-5" />
											</Button>
										</div>
									))}
								</div>

								<Button
									onClick={handleSubmit}
									className="w-full"
									size="lg"
									disabled={slots.length === 0}
								>
									スケジュールを登録
								</Button>
							</div>
						</Card>
					)}

					{slots.length === 0 && (
						<Card className="p-8 border-2 border-dashed">
							<div className="text-center space-y-2">
								<Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
								<p className="text-muted-foreground">
									まだ時間枠が登録されていません
								</p>
								<p className="text-sm text-muted-foreground">
									上のフォームから対応可能な時間を追加してください
								</p>
							</div>
						</Card>
					)}
				</div>
			</main>
		</div>
	);
}
