import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "ceibo"
    | "ceibo-soft"
    | "neutral"
    | "warning";
}

const variantStyles: Record<string, string> = {
  default: "bg-primary text-primary-foreground border-primary shadow-xs",
  primary: "bg-primary text-primary-foreground border-primary shadow-action",
  secondary: "bg-secondary text-secondary-foreground border-border",
  success: "bg-success/10 text-success border-success/25 font-semibold",
  ceibo: "bg-ceibo/10 text-ceibo border-ceibo/25 font-bold",
  "ceibo-soft": "bg-ceibo-soft text-ceibo border-ceibo/20 font-bold",
  neutral: "bg-muted text-muted-foreground border-border font-medium",
  outline: "text-foreground border-border bg-transparent",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25 font-semibold",
  destructive: "bg-destructive/10 text-destructive border-destructive/25 font-semibold",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}
