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
}: {
  title: string;
  items: AdviceViewItem[];
  className?: string;
}) {
  return (
    <Card
      className={`p-3 sm:p-4 bg-background/70 border-border/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        className || ""
      }`}
    >
      <div className="mb-2">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">高得点を狙うコツ</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <CheckCircle2
              className={`mt-0.5 h-4 w-4 ${
                item.checked ? "text-emerald-500" : "text-muted-foreground/50"
              }`}
              aria-hidden
            />
            <span
              className={`text-xs leading-snug ${
                item.checked ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
