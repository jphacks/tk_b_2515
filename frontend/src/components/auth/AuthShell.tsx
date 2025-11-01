import type { ReactNode } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Heart
              className="w-6 h-6 text-primary fill-primary"
              aria-hidden="true"
              focusable="false"
            />
            <span className="font-semibold text-foreground">恋ai</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </main>
    </div>
  );
}
