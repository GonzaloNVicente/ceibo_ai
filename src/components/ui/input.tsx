import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

// Estilo del campo definido en globals.css (.ui-field): relleno gris, sin borde, foco azul.
// Los <select> y <textarea> usan la misma clase para verse iguales.
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn("ui-field", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
