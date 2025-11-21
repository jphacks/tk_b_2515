"use client";

import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export type AdviceViewItem = {
	id: string;
	label: string;
	checked: boolean;
};

export function AdviceChecklist({
	title,
	items,
	className,
	size = "lg",
}: {
	title: string;
	items: AdviceViewItem[];
	className?: string;
	size?: "lg" | "md";
}) {
	const isLarge = size === "lg";

	return (
		<Card
			className={`${
				isLarge
					? "p-4 sm:p-5 rounded-3xl bg-background/85 border-white/30 text-foreground"
					: "p-3 sm:p-4 rounded-2xl bg-background/70"
			} border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
				className || ""
			}`}
		>
			<div className="mb-3">
				<p
					className={`font-semibold ${
						isLarge ? "text-sm sm:text-base" : "text-xs sm:text-sm"
					}`}
				>
					{title}
				</p>
				<p
					className={`font-medium ${
						isLarge
							? "text-[11px] sm:text-xs text-primary"
							: "text-[10px] text-muted-foreground"
					}`}
				>
					高得点を狙うコツ
				</p>
			</div>
			<ul className="space-y-2.5">
				{items.map((item) => (
					<li key={item.id} className="flex items-start gap-2.5">
						<CheckCircle2
							className={`mt-0.5 ${isLarge ? "h-5 w-5" : "h-4 w-4"} ${
								item.checked ? "text-emerald-400" : "text-muted-foreground/50"
							}`}
							aria-hidden
						/>
						<span
							className={`${
								isLarge
									? "text-xs sm:text-sm leading-relaxed"
									: "text-xs leading-snug"
							} ${item.checked ? "text-foreground" : "text-muted-foreground"}`}
						>
							{item.label}
						</span>
					</li>
				))}
			</ul>
		</Card>
	);
}
