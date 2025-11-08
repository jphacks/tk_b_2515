"use client";

import { Earth, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export default function Header() {
	const session = useSession();
	const user = session.data?.user;

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (_e) {
			// ignore
		}
	};

	return (
		<header className="h-16 sm:h-20 px-3 sm:px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
			<div className="w-32 sm:w-40 flex items-center justify-start">
				<Link
					href="/"
					className="relative h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:opacity-80 transition-opacity"
					aria-label="ホームへ"
				>
					<Image
						src="/renai_icon.png"
						alt="恋AIのアイコン"
						fill
						className="object-contain"
					/>
				</Link>
			</div>

			<div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2">
				<Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-pulse" />
				<span className="font-bold text-foreground text-base sm:text-lg">
					恋AI
				</span>
			</div>

			<div className="w-36 sm:w-44 flex items-center justify-end">
				{user ? (
					<div className="flex items-center gap-2">
						<span className="hidden md:inline text-sm text-muted-foreground">
							ようこそ、{user.name ?? "ユーザー"} さん
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="rounded-full hover:bg-primary/10 px-3 text-xs sm:text-sm"
							onClick={handleSignOut}
						>
							ログアウト
						</Button>
					</div>
				) : (
					<Link href="/login">
						<Button
							variant="ghost"
							size="sm"
							className="rounded-full hover:bg-primary/10 flex items-center px-3 text-xs sm:text-sm"
						>
							<Earth className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
							<span>ログイン</span>
						</Button>
					</Link>
				)}
			</div>
		</header>
	);
}
