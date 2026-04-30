import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Multi-line text input. Same border / focus treatment as `<Input>` so
 * the two compose well in the same form row. Defaults to a min height
 * of 80px and vertical resize.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-line-2 bg-card px-3 py-2 text-[13px] leading-relaxed text-ink shadow-sm",
          "transition-[border-color,box-shadow] duration-150",
          "placeholder:text-muted-2",
          "hover:border-ink-3",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
