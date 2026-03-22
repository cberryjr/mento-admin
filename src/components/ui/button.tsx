import * as React from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "default" | "outline" | "danger" | "ghost";
type ButtonSize = "default" | "sm";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default:
    "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline-zinc-900",
  outline:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-900",
  danger:
    "border border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-600",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-900",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-sm",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      type = "button",
      variant = "default",
      size = "default",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };
