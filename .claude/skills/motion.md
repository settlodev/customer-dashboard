---
name: motion
description: Production-ready animations for React using Motion (motion package, formerly framer-motion). Covers gestures, scroll animations, layout animations, variants, spring physics, and SVG. Use for drag/hover/tap interactions, scroll-linked effects, shared element transitions, or anything more complex than a CSS transition. Skip for trivial list animations (use auto-animate) or static content.
---

# Motion for React

**Package:** `motion` (formerly `framer-motion` — same API, same version)
**Latest version:** 12.37.0
**React requirement:** 18.2+ (React 19 fully supported)
**Bundle size:** 2.3 KB (useAnimate mini) → 4.6 KB (LazyMotion + `m`) → 34 KB (full `motion`)

Motion's hybrid engine runs animations natively in the browser via the Web Animations API and ScrollTimeline for 120fps performance, falling back to JS for spring physics, interruptible keyframes, and gesture tracking.

## When to use this skill

**Use Motion when you need:**
- Gestures: drag (+ constraints, momentum), hover, tap, pan, focus
- Scroll-linked animations or viewport-triggered reveals
- Layout animations (FLIP) or shared element transitions (`layoutId`)
- Spring physics for natural motion
- SVG path morphing / line drawing
- Orchestrated sequences (stagger, delayChildren)
- Exit animations on unmount (`AnimatePresence`)

**Skip Motion for:**
- Trivial list add/remove/sort — use `auto-animate` (3.28 KB vs 34 KB)
- Static content with no interaction
- 3D animations — use React Three Fiber
- Simple hover color changes — plain CSS transition is lighter

## Installation

```bash
pnpm add motion       # recommended
npm install motion
yarn add motion
```

CDN (prefer pinned version in production):

```html
<script type="module">
  import motion from "https://cdn.jsdelivr.net/npm/motion@latest/react/+esm"
</script>
```

TypeScript types are bundled — no `@types` package needed.

## Import paths

| Path | Purpose |
| --- | --- |
| `motion/react` | Standard React — `motion`, `AnimatePresence`, hooks |
| `motion/react-client` | Next.js RSC — re-export `motion` as a client component |
| `motion/react-m` | Lightweight `m` component for use under `LazyMotion` |
| `motion/react-mini` | Smallest `useAnimate` variant (2.3 KB) |

## Core: the `motion` component

Drop-in replacement for any HTML/SVG element — `motion.div`, `motion.button`, `motion.circle`, `motion.path`, etc.

```tsx
import { motion } from "motion/react"

<motion.button
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  Click me
</motion.button>
```

### Animatable values

- **CSS properties:** `opacity`, `filter`, `background-image`, `mask-image`, colors (hex/rgba/hsla/oklch/oklab/color-mix), `box-shadow`
- **Independent transform axes:** `x`, `y`, `z`, `scale`, `scaleX`, `scaleY`, `rotate`, `rotateX/Y/Z`, `skewX/Y`, `transformPerspective`
- **Display/visibility:** `"none"/"block"`, `"hidden"/"visible"`

Defaults: spring physics for transforms, tween easing for opacity/color. Override per-animation or globally via `MotionConfig`.

### Keyframes

```tsx
<motion.div
  animate={{ x: [0, 100, 0] }}              // array = keyframes
  transition={{ duration: 2, times: [0, 0.2, 1] }}
/>

<motion.div animate={{ x: [null, 100, 0] }} /> // null = current value
```

## AnimatePresence — exit animations

```tsx
import { AnimatePresence, motion } from "motion/react"

<AnimatePresence>
  {isVisible && (
    <motion.div
      key="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      …
    </motion.div>
  )}
</AnimatePresence>
```

**Critical rules:**
- `AnimatePresence` must stay mounted — wrap the condition, not be wrapped by it.
- Every direct child needs a stable unique `key`. Never use array index.

```tsx
// ❌ Exit won't play — AnimatePresence unmounts with the condition
{isVisible && <AnimatePresence><motion.div>…</motion.div></AnimatePresence>}

// ✅
<AnimatePresence>
  {isVisible && <motion.div key="unique">…</motion.div>}
</AnimatePresence>
```

### Modes

- `mode="sync"` (default) — enter and exit overlap.
- `mode="wait"` — incoming child waits for outgoing to finish. Max one child. Good for step flows / tabs.
- `mode="popLayout"` — exiting items removed from layout flow so siblings reflow immediately. Pairs with `layout`. Parent needs `position: relative` if ancestors have transforms.

### Props

- `initial={false}` — skip enter animation on first mount.
- `onExitComplete` — fires when all exits finish.
- `custom` — passed to dynamic variants of exiting children (access via `usePresenceData()`).
- `propagate` — when `true`, nested `AnimatePresence` triggers child exits when the parent exits.
- `root` — DOM element for `popLayout` style injection (use for Shadow DOM).

### Presence hooks

- `useIsPresent()` — boolean, whether this component is still present.
- `usePresence()` — `[isPresent, safeToRemove]` for manual exit control.
- `usePresenceData()` — read `custom` from ancestor `AnimatePresence`.

## Gestures

```tsx
<motion.div
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ outline: "2px solid #4f46e5" }}
  whileDrag={{ cursor: "grabbing" }}
  onHoverStart={() => {}}
  onTap={(e, info) => {}}
  onPan={(e, info) => { /* info.point, delta, offset, velocity */ }}
/>
```

### Drag

```tsx
<motion.div
  drag                       // or "x" | "y"
  dragConstraints={{ top: -50, left: -50, right: 50, bottom: 50 }}
  dragElastic={0.5}          // 0–1, movement outside constraints
  dragMomentum={true}        // inertia on release
  dragSnapToOrigin={false}   // snap back to start on release
  dragDirectionLock={false}  // lock to detected axis
  dragPropagation={false}    // let child gestures bubble
  onDragEnd={(e, info) => {}}
/>
```

Constrain to a parent ref: `dragConstraints={parentRef}`.
External trigger: `const controls = useDragControls()` → `dragControls={controls}` + `dragListener={false}`, then `controls.start(event)`.
Block a specific gesture from bubbling to the parent: `propagate={{ tap: false }}`.

## Scroll animations

### Viewport-triggered (`whileInView`)

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px", amount: "some" }}
/>
```

`viewport.amount`: `"some"` | `"all"` | `0–1`.

### Scroll-linked (`useScroll`)

```tsx
import { useScroll, useTransform, motion } from "motion/react"

const { scrollYProgress } = useScroll()
const y = useTransform(scrollYProgress, [0, 1], [0, -300])

<motion.div style={{ y }} />
```

**Options:** `target` (ref), `container` (ref — scrollable ancestor), `offset`, `axis` (`"y"` default), `layoutEffect`, `trackContentSize`.

**Offset syntax** — `["start end", "end end"]` — first pair is target start / container end, second is target end / container end. Accepts keywords (`start`/`center`/`end`), `0–1`, `px`, `%`, `vh`/`vw`.

**Returns** motion values: `scrollX`, `scrollY`, `scrollXProgress`, `scrollYProgress`.

## Layout animations

```tsx
<motion.div layout>                            {/* animate position + size */}
<motion.div layout="position">                  {/* only position */}
<motion.div layout="size">                      {/* only size */}
<motion.div layout="preserve-aspect">           {/* images / aspect-locked */}
```

- `layoutId="card-1"` — shared element transition between different mounted elements.
- `LayoutGroup` — sync layout animations across components that don't re-render together.
- `layoutScroll` — on a scrollable container so child measurements account for scroll offset.
- `layoutRoot` — on a `position: fixed` element so children measure against the viewport.
- `layoutAnchor={{ x: 0.5, y: 0 }}` — set the reference point for the animation (0–1).
- `layoutDependency={someValue}` — force remeasurement when the value changes (perf optimization).

**Child distortion:** add `layout` to children so Motion applies counter-scales automatically.
**SVG:** layout animations aren't supported — animate attributes directly.

## Variants — named states + orchestration

```tsx
import { motion, stagger } from "motion/react"

const list = {
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", delayChildren: stagger(0.1) },
  },
  hidden: {
    opacity: 0,
    transition: { when: "afterChildren" },
  },
}

const item = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -20 },
}

<motion.ul variants={list} initial="hidden" animate="visible">
  {items.map((i) => (
    <motion.li key={i.id} variants={item} />   // inherits from parent
  ))}
</motion.ul>
```

Variants propagate to descendant `motion` components. Disable with `inherit={false}`.

**Dynamic variants** — resolve as a function of `custom`:

```tsx
const variants = {
  visible: (i: number) => ({ opacity: 1, transition: { delay: i * 0.1 } }),
  hidden: { opacity: 0 },
}
items.map((item, i) => <motion.div key={i} custom={i} variants={variants} />)
```

## Hooks reference

| Hook | Purpose |
| --- | --- |
| `useMotionValue(initial)` | Animatable value outside the render cycle. Methods: `.get()`, `.set()`, `.jump()`, `.getVelocity()`, `.isAnimating()`, `.stop()`, `.on(event, cb)`. |
| `useTransform(input, inRange, outRange)` | Derive a motion value by mapping ranges. |
| `useSpring(value, config)` | Apply spring smoothing to another motion value. |
| `useMotionTemplate\`…\`` | Tagged template — combine motion values into a CSS string. |
| `useMotionValueEvent(mv, event, cb)` | Subscribe to `change` / `animationStart` / `animationComplete` / `animationCancel`. |
| `useVelocity(mv)` | Motion value tracking velocity of another. |
| `useTime()` | Continuously updating elapsed-ms motion value. |
| `useAnimationFrame(cb)` | Per-frame callback — `cb(t, delta)`. |
| `useScroll(options)` | Scroll-linked motion values (see above). |
| `useInView(ref, options)` | Boolean — is element in viewport. |
| `usePageInView()` | Boolean — is the page in view (tab visibility / scroll). |
| `useAnimate()` | Imperative `[scope, animate]` for sequences and selectors. |
| `useDragControls()` | Manual drag initiation. |
| `useReducedMotion()` | Respect OS `prefers-reduced-motion`. |

### useAnimate (imperative)

```tsx
import { useAnimate } from "motion/react"       // hybrid
// or: import { useAnimate } from "motion/react-mini"  // 2.3 KB

const [scope, animate] = useAnimate()

useEffect(() => {
  const controls = animate([
    [scope.current, { x: "100%" }],
    ["li", { opacity: 1 }, { delay: stagger(0.1) }],  // selectors are scoped to children
  ])
  controls.speed = 0.8
  return () => controls.stop()
}, [])

return <ul ref={scope}>…</ul>
```

### Motion values in style

```tsx
const x = useMotionValue(0)
const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])

<motion.div drag="x" style={{ x, opacity }} />
```

Motion values in `style` update the DOM without React re-renders.

### Animating text content

```tsx
const count = useMotionValue(0)
useEffect(() => { animate(count, 100, { duration: 5 }) }, [])
return <motion.pre>{count}</motion.pre>         // renders live without re-render
```

## Custom components — `motion.create()`

Wrap any component that forwards a ref to a DOM node:

```tsx
// React 19 — ref comes through props
const MyButton = (props: Props & { ref?: Ref<HTMLButtonElement> }) => (
  <button ref={props.ref} {...props} />
)

// React 18 — use forwardRef
const MyButton = React.forwardRef<HTMLButtonElement, Props>((props, ref) => (
  <button ref={ref} {...props} />
))

const MotionButton = motion.create(MyButton)
// Pass motion props through to the inner component:
const MotionButton = motion.create(MyButton, { forwardMotionProps: true })

// Custom elements work too:
const MC = motion.create("custom-element")
```

## Next.js integration

Motion components are client-only. Two patterns:

### Pattern 1 — client wrapper (recommended)

```tsx
// components/motion.ts
"use client"
export * as motion from "motion/react-client"
```

```tsx
// app/page.tsx — still a Server Component
import { motion } from "@/components/motion"
export default function Page() {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>…</motion.div>
}
```

### Pattern 2 — direct client component

```tsx
"use client"
import { motion } from "motion/react"
export function Card() { return <motion.div>…</motion.div> }
```

**Known rough edges:**
- `AnimatePresence` exits can fail during soft navigation — key on the route.
- `Reorder` is flaky with Next.js routing — prefer `dnd-kit` for reorderable lists in Next.

## Tailwind integration

Let each library own its lane: Tailwind for static styling, Motion for animation.

```tsx
<motion.button
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

**Remove Tailwind `transition-*` classes on animated elements** — they conflict with Motion's inline styles and cause stutter.

## Performance

### LazyMotion — 34 KB → 4.6 KB

```tsx
import { LazyMotion, domAnimation } from "motion/react"
import * as m from "motion/react-m"

<LazyMotion features={domAnimation} strict>
  <m.div animate={{ opacity: 1 }} />   {/* use `m`, not `motion` */}
</LazyMotion>
```

- `domAnimation` — core animations + gestures (~15 KB).
- `domMax` — adds layout + drag (~25 KB).
- Async for code-splitting:

```tsx
const loadFeatures = () => import("./features").then((m) => m.default)
<LazyMotion features={loadFeatures}>…</LazyMotion>
```

`strict` throws if a standard `motion.*` sneaks inside and defeats the split.

### Hardware acceleration hints

```tsx
<motion.div style={{ willChange: "transform" }} animate={{ x: 100, rotate: 45 }} />
```

Worth it for `transform`, `opacity`, `backgroundColor`, `clipPath`, `filter`.

### Big lists → virtualize

Animating 50+ items chokes. Combine Motion with `react-window`, `react-virtuoso`, or `@tanstack/react-virtual`.

## Accessibility

```tsx
import { MotionConfig } from "motion/react"

<MotionConfig reducedMotion="user">   {/* "user" | "always" | "never" */}
  <App />
</MotionConfig>
```

`"user"` respects the OS `prefers-reduced-motion` setting. Applies to `AnimatePresence` too.

Manual check:
```tsx
const shouldReduce = useReducedMotion()
```

## Common patterns

### Modal with backdrop

```tsx
<AnimatePresence>
  {open && (
    <>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="dialog"
        className="fixed inset-0 m-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >…</motion.div>
    </>
  )}
</AnimatePresence>
```

### Accordion (height: auto)

```tsx
<motion.div
  initial={{ height: 0 }}
  animate={{ height: "auto" }}
  exit={{ height: 0 }}
  style={{ overflow: "hidden" }}
/>
```

### Scroll-linked progress bar

```tsx
const { scrollYProgress } = useScroll()
<motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left"
           style={{ scaleX: scrollYProgress }} />
```

### Tab underline (`layoutId`)

```tsx
{tabs.map((t) => (
  <button key={t} onClick={() => setActive(t)} className="relative px-4 py-2">
    {t}
    {active === t && (
      <motion.div layoutId="underline" className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-500" />
    )}
  </button>
))}
```

### Staggered list reveal

```tsx
const container = { show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => <motion.li key={i.id} variants={item}>{i.label}</motion.li>)}
</motion.ul>
```

## Gotchas

| Symptom | Fix |
| --- | --- |
| Exit animation doesn't play | `AnimatePresence` must wrap the conditional; children need unique `key`s. |
| Animations stutter | Remove Tailwind `transition-*` classes; they fight Motion's inline styles. |
| Layout animations cut off in a scrollable container | Add `layoutScroll` to the container. |
| Layout animations misplaced in `position: fixed` | Add `layoutRoot`. |
| `layoutId` elements don't unmount cleanly | Wrap in `LayoutGroup`; avoid mixing `exit` with `layout` on the same element. |
| Next.js build: `motion is not defined` | Add `"use client"`, or import from `motion/react-client`. |
| Reorder gets stuck in Next.js | Use `dnd-kit` instead. |
| Perf tanks with big lists | Virtualize (react-window / virtuoso / tanstack-virtual). |

## Reorder (simple drag-to-reorder)

```tsx
import { Reorder } from "motion/react"

<Reorder.Group axis="y" values={items} onReorder={setItems}>
  {items.map((item) => (
    <Reorder.Item key={item.id} value={item}>{item.label}</Reorder.Item>
  ))}
</Reorder.Group>
```

Good for vertical/horizontal single-axis lists. Not suitable for grids, cross-column drag, or scrollable-container drag — reach for `dnd-kit` there.

## Motion Studio (optional tooling)

VS Code / Cursor extension: AI-powered animation generation, visual editor, CSS/Motion transition editor, searchable examples. Separate install — see https://motion.dev/studio.

## References

- Docs: https://motion.dev/docs/react
- Examples: https://motion.dev/examples (300+)
- GitHub: https://github.com/motiondivision/motion
- npm: https://www.npmjs.com/package/motion
- Changelog: https://motion.dev/changelog
