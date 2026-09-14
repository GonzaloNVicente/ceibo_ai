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

const variantStyles: Record<ButtonVariant, string> = {
  default: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
  primary: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
  secondary: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary",
  outline: "border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary",
  ghost: "border border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
  brand: "border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-3.5",
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
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 select-none";

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
