"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="h-16 sm:h-20 px-3 sm:px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      {/* Left: icon */}
      <div className="w-12 sm:w-16 md:w-20 flex items-center justify-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="relative h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="ページを更新"
        >
          <Image src="/a.png" alt="恋AIのアイコン" fill className="object-contain" />
        </button>
      </div>

      {/* Center: title */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-pulse" />
        <span className="font-bold text-foreground text-base sm:text-lg">恋AI</span>
      </div>

      {/* Right: Home / language */}
      <div className="w-12 sm:w-16 md:w-20 flex items-center justify-center">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-primary/10 flex items-center px-2 sm:px-3 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">言語選択</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
