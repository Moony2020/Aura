import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function StorefrontContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("storefront-container", className)} {...props} />;
}
