"use client";

/**
 * AlertDialog — modal confirmation. Distinct from `<Dialog>` (general
 * modal for forms, viewers) and `<Toast>` (transient bottom-right).
 *
 * Built on top of `@radix-ui/react-alert-dialog`, so it respects the
 * a11y semantics for blocking confirmations (focus trap, Esc to
 * cancel, no click-outside dismiss).
 *
 * Visual contract (matches the design's `.dialog` rules):
 *   - 440 px card, hairline border, 14 px radius, drop shadow
 *   - Two-column grid: 44 px tinted icon disc · body
 *   - 17 px display-weight title, 13.5 px body copy
 *   - Footer split by hairline; cancel (outline) + confirm (tone fill)
 *   - Optional require-text confirmation: type a token to enable
 *
 * Motion:
 *   Overlay fades; the card fades + scales (96→100%) + drifts down
 *   (-6 → 0). Spring entry tuned for a confident settle, eased exit.
 *   The icon pops in a fraction later so the eye lands on it.
 *   `prefers-reduced-motion` collapses everything to flat fades.
 *
 * Usage:
 *
 *   <AlertDialog>
 *     <AlertDialogTrigger asChild><Button variant="ghost">Delete</Button></AlertDialogTrigger>
 *     <AlertDialogContent tone="danger">
 *       <AlertDialogIcon><Trash2 className="h-5 w-5" /></AlertDialogIcon>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>Delete this product?</AlertDialogTitle>
 *         <AlertDialogDescription>
 *           This permanently removes "Cappuccino" and its 3 variants.
 *         </AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Cancel</AlertDialogCancel>
 *         <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 *
 * For high-stakes destructive actions, opt into the require-text flow:
 *
 *   <AlertDialogContent tone="danger" requireText="DELETE">
 *     ...header / body...
 *     <AlertDialogRequireText />
 *     <AlertDialogFooter>...</AlertDialogFooter>
 *   </AlertDialogContent>
 *
 * The Confirm button stays disabled until the user types the token
 * exactly. The token field renders just above the footer.
 */

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from "framer-motion";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Tone CSS-variable bindings — same trick toast / notice-bar / alert
// use. Children read --tone for the icon disc, the confirm-button fill,
// and the require-text accent.
// ─────────────────────────────────────────────────────────────────────

const TONE_STYLES = {
  default:
    "[--tone:hsl(var(--ink))] [--tone-tint:hsl(var(--canvas))] [--tone-tint-strong:hsl(var(--canvas))]",
  success:
    "[--tone:hsl(var(--pos))] [--tone-tint:hsl(var(--pos)/0.10)] [--tone-tint-strong:hsl(var(--pos)/0.16)]",
  info: "[--tone:#4F46E5] [--tone-tint:rgb(79_70_229_/_0.06)] [--tone-tint-strong:rgb(79_70_229_/_0.14)]",
  warning:
    "[--tone:hsl(var(--warn))] [--tone-tint:hsl(var(--warn)/0.12)] [--tone-tint-strong:hsl(var(--warn)/0.18)]",
  danger:
    "[--tone:hsl(var(--neg))] [--tone-tint:hsl(var(--neg)/0.10)] [--tone-tint-strong:hsl(var(--neg)/0.16)]",
} as const;

type AlertDialogTone = keyof typeof TONE_STYLES;

// ─────────────────────────────────────────────────────────────────────
// Open-state context — Content uses this to drive AnimatePresence
// without consumers having to wire up `forceMount` themselves.
// ─────────────────────────────────────────────────────────────────────

const AlertDialogOpenContext = React.createContext<boolean>(false);

// ─────────────────────────────────────────────────────────────────────
// Require-text context — wires the typed token through to the action
// button so it can stay disabled until the user types it exactly.
// ─────────────────────────────────────────────────────────────────────

interface AlertDialogContextValue {
  tone: AlertDialogTone;
  requireText?: string;
  typed: string;
  setTyped: (v: string) => void;
  /** True when no `requireText` is set, OR the user has typed it exactly. */
  canConfirm: boolean;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  tone: "default",
  requireText: undefined,
  typed: "",
  setTyped: () => {},
  canConfirm: true,
});

function useAlertDialog() {
  return React.useContext(AlertDialogContext);
}

// ─────────────────────────────────────────────────────────────────────
// Root — wraps Radix Root and tracks open state for AnimatePresence.
// Backwards-compatible: accepts the same controlled / uncontrolled
// shape as `AlertDialogPrimitive.Root`.
// ─────────────────────────────────────────────────────────────────────

type AlertDialogRootProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Root
>;

const AlertDialog: React.FC<AlertDialogRootProps> = ({
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  ...props
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const currentOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      // Mirror state locally even in controlled mode so context stays
      // in sync without an extra render from the parent.
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  return (
    <AlertDialogOpenContext.Provider value={currentOpen}>
      <AlertDialogPrimitive.Root
        {...props}
        open={controlledOpen}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
      />
    </AlertDialogOpenContext.Provider>
  );
};

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

// ─────────────────────────────────────────────────────────────────────
// Motion presets — confident settle, quick exit. Subtle deltas so the
// dialog never feels "showy".
// ─────────────────────────────────────────────────────────────────────

const overlayEnter: Transition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] };
const overlayExit: Transition = { duration: 0.16, ease: [0.4, 0, 0.6, 1] };

const contentEnter: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.85,
};
const contentExit: Transition = { duration: 0.14, ease: [0.4, 0, 1, 1] };

const iconEnter: Transition = {
  type: "spring",
  stiffness: 480,
  damping: 24,
  mass: 0.6,
  delay: 0.08,
};

// ─────────────────────────────────────────────────────────────────────
// Overlay — preserved as a separate exported primitive for callers
// who compose Portal/Overlay/Content manually. Internal Content does
// not use this; it renders its own animated overlay below.
// ─────────────────────────────────────────────────────────────────────

const OVERLAY_CLASSES =
  "fixed inset-0 z-[1200] bg-[rgba(20,17,12,0.45)] backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(20,17,12,0.30)] supports-[backdrop-filter]:backdrop-blur-[12px]";

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(OVERLAY_CLASSES, className)}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

// ─────────────────────────────────────────────────────────────────────
// Content — animated card. The wrapper div handles fixed-position
// centering (via `grid place-items-center`) so motion's transform on
// the inner card composes cleanly without fighting `-translate-1/2`.
// ─────────────────────────────────────────────────────────────────────

const contentVariants = cva(
  [
    "relative grid w-[440px] max-w-[calc(100vw-48px)] min-h-[208px]",
    // Two-column on ≥sm: icon disc | body. Stacks on small screens so
    // the title is never cramped against the disc.
    "grid-cols-1 gap-y-3 sm:grid-cols-[44px_1fr] sm:gap-x-3.5 sm:gap-y-1.5",
    "sm:grid-rows-[auto_1fr_auto]",
    "rounded-[10px] border border-line bg-card px-5 pt-7 pb-5",
    "shadow-[0_1px_0_rgba(20,17,12,0.04),0_36px_90px_-22px_rgba(20,17,12,0.34),0_10px_24px_-10px_rgba(20,17,12,0.12)]",
  ].join(" "),
  {
    variants: {
      tone: TONE_STYLES,
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

interface AlertDialogContentProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
      "color"
    >,
    VariantProps<typeof contentVariants> {
  /** When set, the Confirm button stays disabled until the user types
   *  this exact string in the require-text field. Use for high-stakes
   *  actions (e.g. typing "DELETE"). */
  requireText?: string;
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, tone, children, requireText, ...props }, ref) => {
  const open = React.useContext(AlertDialogOpenContext);
  const reduce = useReducedMotion();
  const [typed, setTyped] = React.useState("");
  const canConfirm = !requireText || typed === requireText;

  // Reset typed token when the dialog closes so the next open starts blank.
  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const ctxValue = React.useMemo<AlertDialogContextValue>(
    () => ({
      tone: tone ?? "default",
      requireText,
      typed,
      setTyped,
      canConfirm,
    }),
    [tone, requireText, typed, canConfirm],
  );

  // Reduced-motion: flat fades only, no transform. Keeps the dialog
  // accessible without any hint of bounce or drift.
  const overlayMotion: HTMLMotionProps<"div"> = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: overlayExit },
        transition: overlayEnter,
      };

  const contentMotion: HTMLMotionProps<"div"> = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.1 } },
        transition: { duration: 0.14 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: -6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: -4, transition: contentExit },
        transition: contentEnter,
      };

  return (
    <AnimatePresence>
      {open && (
        <AlertDialogPrimitive.Portal forceMount>
          {/* Plain motion div — no Radix Overlay wrapper needed here */}
          <motion.div className={OVERLAY_CLASSES} {...overlayMotion} />

          <AlertDialogContext.Provider value={ctxValue}>
            <AlertDialogPrimitive.Content forceMount ref={ref} {...props}>
              <div className="pointer-events-none fixed inset-0 z-[1201] grid place-items-center p-6">
                <motion.div
                  {...contentMotion}
                  className={cn(
                    contentVariants({ tone }),
                    "pointer-events-auto",
                    className,
                  )}
                >
                  {children}
                </motion.div>
              </div>
            </AlertDialogPrimitive.Content>
          </AlertDialogContext.Provider>
        </AlertDialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
});
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

// ─────────────────────────────────────────────────────────────────────
// Layout — icon disc, header, footer.
// ─────────────────────────────────────────────────────────────────────

/**
 * Tinted icon disc. Sits in the first grid column on `sm:` and above.
 * Stacks above the header on small screens (handled by Tailwind grid).
 *
 * Pops in a beat after the dialog settles so the eye lands on it
 * rather than tracking a moving target.
 */
const AlertDialogIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      aria-hidden
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : iconEnter}
      className={cn(
        "row-span-2 grid h-11 w-11 place-items-center rounded-full",
        "bg-[var(--tone-tint-strong)] text-[var(--tone)]",
        className,
      )}
      {...(props as HTMLMotionProps<"div">)}
    />
  );
});
AlertDialogIcon.displayName = "AlertDialogIcon";

/**
 * Header wrapper — keeps title + description stacked. Drop the title
 * and description directly inside it.
 */
const AlertDialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-w-0 flex-col gap-1.5", className)}
    {...props}
  />
));
AlertDialogHeader.displayName = "AlertDialogHeader";

/**
 * Footer — actions row spanning both grid columns. Cancel on the left,
 * Confirm on the right (or just Confirm for `kind="alert"` usage).
 */
const AlertDialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "col-span-full mt-3 flex justify-end gap-2 border-t border-line pt-3.5",
      className,
    )}
    {...props}
  />
));
AlertDialogFooter.displayName = "AlertDialogFooter";

// ─────────────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────────────

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-[17px] font-semibold leading-tight tracking-[-0.015em] text-ink",
      className,
    )}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-[13.5px] leading-relaxed text-ink-2 text-pretty",
      className,
    )}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

// ─────────────────────────────────────────────────────────────────────
// Require-text input — high-stakes confirmation flow.
// ─────────────────────────────────────────────────────────────────────

/**
 * Renders the "Type X to confirm" input when the parent
 * `<AlertDialogContent>` has a `requireText` prop. Returns null
 * otherwise, so callers can drop it in unconditionally.
 *
 * The input value lives on context, so `<AlertDialogAction>` can read
 * `canConfirm` and disable itself until the token matches.
 */
const AlertDialogRequireText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { requireText, typed, setTyped } = useAlertDialog();
  if (!requireText) return null;

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <label className="text-[11.5px] tracking-[0.01em] text-muted-foreground">
        Type{" "}
        <span className="rounded-[3px] bg-[var(--tone-tint)] px-1.5 py-px font-mono text-[11.5px] font-medium tracking-[0.06em] text-[var(--tone)]">
          {requireText}
        </span>{" "}
        to confirm
      </label>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "rounded-md border border-line bg-surface px-2.5 py-2 font-mono text-[13px] tracking-[0.04em] text-ink",
          "outline-none transition-[border-color,box-shadow,background-color] duration-150",
          "focus:border-[var(--tone)] focus:bg-card focus:ring-[3px] focus:ring-[color-mix(in_oklab,var(--tone)_18%,transparent)]",
        )}
      />
    </div>
  );
});
AlertDialogRequireText.displayName = "AlertDialogRequireText";

// ─────────────────────────────────────────────────────────────────────
// Action buttons
// ─────────────────────────────────────────────────────────────────────

/**
 * Confirm button. Fills with the tone colour. Stays disabled when the
 * `requireText` token hasn't been typed yet.
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, disabled, ...props }, ref) => {
  const { canConfirm } = useAlertDialog();
  const isDisabled = disabled || !canConfirm;

  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        "rounded-md px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.005em] text-white",
        "border border-[var(--tone)] bg-[var(--tone)]",
        "transition-[background-color,filter] duration-150 hover:brightness-[0.94]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted-2 disabled:border-line disabled:filter-none",
        className,
      )}
      {...props}
    />
  );
});
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

/**
 * Cancel button. Outline-style, neutral.
 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
      "rounded-md px-3.5 py-1.5 text-[13px] font-medium tracking-[-0.005em] text-ink-2",
      "border border-line bg-card transition-colors duration-150 hover:bg-canvas hover:border-line-2",
      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15",
      className,
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogRequireText,
  AlertDialogAction,
  AlertDialogCancel,
};
