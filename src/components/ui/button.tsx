import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link"
  | "brand";

export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon"
  | "icon-sm"
  | "icon-lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Botones tipo pastilla. Un solo boton "primary" (azul) por pantalla; el resto, secondary / outline / ghost.
const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-foreground hover:brightness-95 dark:hover:brightness-125",
  outline: "border border-border bg-card text-foreground hover:bg-secondary",
  ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
  brand: "bg-primary text-primary-foreground hover:bg-primary/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6",
  icon: "size-10 p-0",
  "icon-sm": "size-8 p-0",
  "icon-lg": "size-11 p-0",
};

export function buttonVariants({
  variant = "secondary",
  size = "default",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color,color,transform,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none";

  return cn(
    baseStyles,
    variantStyles[variant] || variantStyles.secondary,
    sizeStyles[size] || sizeStyles.default,
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
