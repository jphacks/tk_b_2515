import type { ComponentProps } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = ComponentProps<typeof Card> & {
  withPadding?: boolean;
};

export function AuthCard({
  children,
  className,
  withPadding = true,
  ...props
}: AuthCardProps) {
  return (
    <Card
      className={cn("border-2", withPadding && "p-6 sm:p-8", className)}
      {...props}
    >
      {children}
    </Card>
  );
}
