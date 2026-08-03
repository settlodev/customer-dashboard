import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Generic surface container — sits on the canvas with a hairline
 * border + subtle shadow. Use for any block of content that needs to
 * read as "its own thing" against the page.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-line bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight tracking-tight text-ink",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { pad0?: boolean }
>(({ className, pad0, ...props }, ref) => (
  <div ref={ref} className={cn(pad0 ? "p-0" : "p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

interface CardHeadProps {
  /** 24px tinted icon square — the `.od-card-title .ico` treatment. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Right-aligned slot (a count chip, an action button, etc.). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Card section header — icon chip + title + optional trailing slot, the
 * `.od-card-head` treatment. For cards built directly on `Card` (not via the
 * order-detail `RailCard`/`PanelCard`, which already bundle an equivalent
 * header of their own).
 */
const CardHead = React.forwardRef<HTMLDivElement, CardHeadProps>(
  ({ icon, title, trailing, className }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2.5 px-5 pt-4 pb-3", className)}
    >
      {icon && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 text-[14px] font-semibold tracking-tight text-ink">
        {title}
      </span>
      {trailing}
    </div>
  ),
)
CardHead.displayName = "CardHead"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardHead, CardFooter, CardTitle, CardDescription, CardContent }
