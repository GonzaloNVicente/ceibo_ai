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
    | "info"
    | "ceibo"
    | "ceibo-soft"
    | "neutral"
    | "warning";
}

// Etiquetas tipo pastilla con fondo tenue y texto fuerte (contraste >= 4.5:1).
// verde = bueno · rojo (destructive) = malo / pide accion · azul (info) = informativo · naranja = intermedio.
// `ceibo` / `ceibo-soft` quedaron como alias de `info`: la terracota es solo el logo de la marca.
const variantStyles: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info-strong",
  ceibo: "bg-info/10 text-info-strong",
  "ceibo-soft": "bg-info/10 text-info-strong",
  neutral: "bg-secondary text-muted-foreground",
  outline: "bg-transparent text-foreground ring-1 ring-inset ring-border",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-negative/10 text-negative",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}
