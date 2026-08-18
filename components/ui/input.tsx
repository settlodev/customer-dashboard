import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Text input — outline-style on the card surface, primary focus ring.
 * Visual contract:
 *   - 36px tall, 6px corner radius, 1px hairline border (--line-2)
 *   - on focus: border becomes --primary, 3px tinted ring at 15%
 *   - placeholder uses --muted-2 (softer than --muted-foreground)
 *
 * Behavioral contract is unchanged from the shadcn original.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-line-2 bg-card px-3 py-2 text-[13px] text-ink shadow-sm",
          "transition-[border-color,box-shadow] duration-150",
          "placeholder:text-muted-2",
          "hover:border-ink-3",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
