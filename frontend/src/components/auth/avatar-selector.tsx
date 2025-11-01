"use client";

import Image from "next/image";
import { avatarOptions, type AvatarOption } from "@/lib/avatar-options";
import { cn } from "@/lib/utils";

type AvatarSelectorProps = {
  value: string | null;
  onChange: (value: string) => void;
  options?: AvatarOption[];
};

export function AvatarSelector({
  value,
  onChange,
  options = avatarOptions,
}: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {options.map((option) => {
        const isSelected = option.src === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.src)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/10 shadow-lg"
                : "border-border bg-card hover:border-primary/60 hover:bg-primary/5"
            )}
          >
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-background group-hover:border-primary/60">
              <Image
                src={option.src}
                alt={option.label}
                fill
                sizes="80px"
                className="object-cover"
                priority={false}
              />
            </div>
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
            {isSelected ? (
              <span className="absolute -top-2 -right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                選択中
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
