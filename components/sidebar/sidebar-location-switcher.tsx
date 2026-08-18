// "use client";
//
// /**
//  * Top sidebar destination toggle.
//  *
//  */
//
// import * as Sentry from "@sentry/nextjs";
// import {
//   ArrowRight,
//   Check,
//   ChevronDown,
//   Loader2,
//   MapPin,
//   Plus,
//   Search as SearchIcon,
//   Store as StoreIcon,
//   Warehouse as WarehouseIcon,
// } from "lucide-react";
// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";
// import { createPortal } from "react-dom";
//
// import {
//   switchToLocation,
//   switchToStore,
//   switchToWarehouse,
// } from "@/lib/actions/destination";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import type { Location } from "@/types/location/type";
// import type { Store } from "@/types/store/type";
// import type { Warehouses } from "@/types/warehouse/warehouse/type";
//
// type ScopeKey = "location" | "warehouse" | "store";
//
// type Active =
//   | { kind: "location"; data: Location }
//   | { kind: "store"; data: Store }
//   | { kind: "warehouse"; data: Warehouses };
//
// interface Props {
//   locationList?: Location[] | null;
//   currentLocation?: Location;
//   storeList?: Store[];
//   currentStore?: Store;
//   warehouseList?: Warehouses[];
//   warehouse?: Warehouses;
// }
//
// const SCOPE_META: Record<
//   ScopeKey,
//   { label: string; singular: string; icon: typeof MapPin }
// > = {
//   location: { label: "Locations", singular: "location", icon: MapPin },
//   warehouse: {
//     label: "Warehouses",
//     singular: "warehouse",
//     icon: WarehouseIcon,
//   },
//   store: { label: "Stores", singular: "store", icon: StoreIcon },
// };
//
// const SCOPE_TINT: Record<ScopeKey, string> = {
//   location: "bg-primary/10 text-primary border-primary/30",
//   warehouse: "bg-indigo-50 text-indigo-600 border-indigo-200",
//   store: "bg-pos/10 text-pos border-pos/30",
// };
//
// export function SidebarLocationSwitcher({
//   locationList,
//   currentLocation,
//   storeList,
//   currentStore,
//   warehouseList,
//   warehouse,
// }: Props) {
//   const active: Active | null = useMemo(() => {
//     if (warehouse?.id) return { kind: "warehouse", data: warehouse };
//     if (currentStore?.id) return { kind: "store", data: currentStore };
//     if (currentLocation?.id) return { kind: "location", data: currentLocation };
//     return null;
//   }, [warehouse, currentStore, currentLocation]);
//
//   const [scope, setScope] = useState<ScopeKey>(active?.kind ?? "location");
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const [anchor, setAnchor] = useState<{
//     left: number;
//     top: number;
//     width: number;
//   } | null>(null);
//   const [confirm, setConfirm] = useState<Active | null>(null);
//   const [loadingId, setLoadingId] = useState<string | null>(null);
//
//   const wrapRef = useRef<HTMLDivElement | null>(null);
//   const btnRef = useRef<HTMLButtonElement | null>(null);
//   const popRef = useRef<HTMLDivElement | null>(null);
//
//   useEffect(() => {
//     if (open && active) setScope(active.kind);
//   }, [open, active]);
//
//   useEffect(() => {
//     if (!open) return;
//     const update = () => {
//       if (!btnRef.current) return;
//       const r = btnRef.current.getBoundingClientRect();
//       setAnchor({ left: r.left, top: r.bottom + 8, width: r.width });
//     };
//     update();
//     window.addEventListener("resize", update);
//     window.addEventListener("scroll", update, true);
//     return () => {
//       window.removeEventListener("resize", update);
//       window.removeEventListener("scroll", update, true);
//     };
//   }, [open]);
//
//   useEffect(() => {
//     if (!open) return;
//     const onDoc = (e: MouseEvent) => {
//       const t = e.target as Node;
//       if (wrapRef.current?.contains(t)) return;
//       if (popRef.current?.contains(t)) return;
//       setOpen(false);
//     };
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setOpen(false);
//     };
//     document.addEventListener("mousedown", onDoc);
//     window.addEventListener("keydown", onKey);
//     return () => {
//       document.removeEventListener("mousedown", onDoc);
//       window.removeEventListener("keydown", onKey);
//     };
//   }, [open]);
//
//   useEffect(() => {
//     setQuery("");
//   }, [scope, open]);
//
//   const counts: Record<ScopeKey, number> = {
//     location: locationList?.length ?? 0,
//     warehouse: warehouseList?.length ?? 0,
//     store: storeList?.length ?? 0,
//   };
//   const totalDestinations = counts.location + counts.warehouse + counts.store;
//
//   const items = useMemo(() => {
//     const base =
//       scope === "location"
//         ? (locationList ?? [])
//         : scope === "warehouse"
//           ? (warehouseList ?? [])
//           : (storeList ?? []);
//     if (!query.trim()) return base;
//     const q = query.toLowerCase();
//     return base.filter((it) => {
//       const name = (it as { name?: string }).name?.toLowerCase() ?? "";
//       const code = (it as { code?: string }).code?.toLowerCase() ?? "";
//       const region = (it as { region?: string }).region?.toLowerCase() ?? "";
//       return name.includes(q) || code.includes(q) || region.includes(q);
//     });
//   }, [scope, query, locationList, warehouseList, storeList]);
//
//   const handlePick = useCallback(
//     (dest: Active) => {
//       if (active?.kind === dest.kind && active.data.id === dest.data.id) {
//         setOpen(false);
//         return;
//       }
//       setConfirm(dest);
//       setOpen(false);
//     },
//     [active],
//   );
//
//   const handleConfirm = useCallback(async () => {
//     if (!confirm) return;
//     setLoadingId(confirm.data.id);
//     try {
//       switch (confirm.kind) {
//         case "location":
//           await switchToLocation(confirm.data);
//           break;
//         case "store":
//           await switchToStore(confirm.data);
//           break;
//         case "warehouse":
//           await switchToWarehouse(confirm.data);
//           break;
//       }
//       if (confirm.kind === "warehouse") {
//         const wh = confirm.data;
//         window.location.href = wh.active ? "/warehouse" : "/select-location";
//       } else if (confirm.kind === "store") {
//         const st = confirm.data;
//         window.location.href = st.active ? "/dashboard" : "/select-location";
//       } else {
//         const loc = confirm.data;
//         window.location.href = loc.active
//           ? "/dashboard"
//           : `/subscription?location=${loc.id}`;
//       }
//     } catch (error) {
//       Sentry.captureException(error);
//       setLoadingId(null);
//       setConfirm(null);
//     }
//   }, [confirm]);
//
//   if (totalDestinations <= 1 && !active) return null;
//
//   const activeKind: ScopeKey = active?.kind ?? "location";
//   const ActiveIcon = SCOPE_META[activeKind].icon;
//   const activeName = active?.data.name ?? "Select destination";
//   const activeMeta = active
//     ? active.kind === "location"
//       ? ((active.data as Location).region ?? "")
//       : ((active.data as Store | Warehouses).code ?? "")
//     : "";
//
//   const popover = open && anchor && (
//     <div
//       ref={popRef}
//       role="dialog"
//       style={{
//         position: "fixed",
//         left: anchor.left,
//         top: anchor.top,
//         width: Math.max(anchor.width, 380),
//         pointerEvents: "auto",
//       }}
//       className="z-[1100] flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[0_1px_0_rgba(20,17,12,0.04),0_24px_60px_-16px_rgba(20,17,12,0.30),0_6px_16px_-6px_rgba(20,17,12,0.10)]"
//     >
//       {/* segmented tabs */}
//       <div
//         role="tablist"
//         className="m-0.5 grid grid-cols-3 gap-0.5 rounded-[9px] bg-canvas p-0.5"
//       >
//         {(Object.keys(SCOPE_META) as ScopeKey[]).map((key) => {
//           const def = SCOPE_META[key];
//           const isActive = scope === key;
//           const Ico = def.icon;
//           return (
//             <button
//               key={key}
//               role="tab"
//               aria-selected={isActive}
//               onClick={() => setScope(key)}
//               className={cn(
//                 "flex items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-[12px] tracking-tight transition-colors",
//                 isActive
//                   ? "bg-card text-ink font-medium shadow-[0_1px_0_rgba(20,17,12,0.04),0_0_0_1px_hsl(var(--line))]"
//                   : "text-muted-foreground hover:text-ink-2",
//               )}
//             >
//               <Ico
//                 className={cn(
//                   "h-3 w-3",
//                   isActive ? "text-primary" : "text-current",
//                 )}
//               />
//               <span className="whitespace-nowrap">{def.label}</span>
//               <span
//                 className={cn(
//                   "rounded px-1 font-mono text-[10px]",
//                   isActive
//                     ? "bg-primary/15 text-primary border-transparent"
//                     : "border border-line bg-card text-muted-2",
//                 )}
//               >
//                 {counts[key]}
//               </span>
//             </button>
//           );
//         })}
//       </div>
//
//       {/* search (only when there are enough rows to be worth filtering) */}
//       {items.length > 4 || query ? (
//         <div className="mx-1 mb-0.5 mt-1.5 flex items-center gap-2 rounded-lg border border-transparent bg-canvas px-2.5 py-1.5 transition-colors focus-within:border-primary focus-within:bg-card focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,hsl(var(--primary))_14%,transparent)]">
//           <SearchIcon className="h-3.5 w-3.5 text-muted-2" />
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder={`Search ${SCOPE_META[scope].label.toLowerCase()}…`}
//             className="flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted-2"
//             autoFocus
//           />
//         </div>
//       ) : null}
//
//       {/* list */}
//       <div className="min-h-0 flex-1 overflow-y-auto p-1">
//         {items.length === 0 && (
//           <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">
//             {query
//               ? `No ${SCOPE_META[scope].label.toLowerCase()} match "${query}"`
//               : `No ${SCOPE_META[scope].label.toLowerCase()} yet`}
//           </div>
//         )}
//
//         {items.map((it) => {
//           const id = it.id;
//           const isCurrent = active?.kind === scope && active.data.id === id;
//           const itemActive = (it as { active?: boolean }).active !== false;
//           const subline =
//             scope === "location"
//               ? ((it as Location).region ?? "")
//               : scope === "warehouse"
//                 ? `${(it as Warehouses).code ?? ""}${(it as Warehouses).primary ? " · Primary" : ""}`
//                 : ((it as Store).code ?? "");
//
//           const dest: Active =
//             scope === "location"
//               ? { kind: "location", data: it as Location }
//               : scope === "warehouse"
//                 ? { kind: "warehouse", data: it as Warehouses }
//                 : { kind: "store", data: it as Store };
//
//           return (
//             <button
//               key={id}
//               onClick={() => handlePick(dest)}
//               className={cn(
//                 "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
//                 isCurrent ? "bg-primary/[0.07]" : "hover:bg-canvas",
//               )}
//             >
//               <span
//                 className={cn(
//                   "grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border bg-canvas",
//                   SCOPE_TINT[scope],
//                   isCurrent && "bg-card border-primary/40",
//                 )}
//               >
//                 {scope === "location" ? (
//                   <MapPin className="h-3.5 w-3.5" />
//                 ) : scope === "warehouse" ? (
//                   <WarehouseIcon className="h-3.5 w-3.5" />
//                 ) : (
//                   <StoreIcon className="h-3.5 w-3.5" />
//                 )}
//               </span>
//               <span className="min-w-0 flex-1">
//                 <span className="flex items-center gap-1.5 text-[13px] font-medium leading-tight text-ink">
//                   <span className="truncate">
//                     {(it as { name?: string }).name ?? "Unnamed"}
//                   </span>
//                   {!itemActive && (
//                     <span className="flex-shrink-0 rounded border border-line bg-canvas px-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
//                       Inactive
//                     </span>
//                   )}
//                 </span>
//                 {subline && (
//                   <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
//                     {subline}
//                   </span>
//                 )}
//               </span>
//               {isCurrent ? (
//                 <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
//               ) : (
//                 <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-2 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
//               )}
//             </button>
//           );
//         })}
//       </div>
//
//       <div className="mt-0.5 border-t border-line px-1 pb-1 pt-1.5">
//         <button
//           type="button"
//           className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-2 text-[12.5px] font-semibold text-primary-dark transition-colors hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
//         >
//           <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
//           Add {SCOPE_META[scope].singular}
//         </button>
//       </div>
//     </div>
//   );
//
//   return (
//     <>
//       <div ref={wrapRef} className="w-full">
//         <button
//           ref={btnRef}
//           type="button"
//           onClick={() => setOpen((o) => !o)}
//           aria-haspopup="dialog"
//           aria-expanded={open}
//           disabled={loadingId !== null}
//           className={cn(
//             "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2 py-2 text-left transition-colors",
//             "hover:border-line-2 hover:bg-card",
//             open &&
//               "border-primary bg-card shadow-[0_0_0_3px_color-mix(in_oklab,hsl(var(--primary))_14%,transparent)]",
//           )}
//         >
//           <span
//             className={cn(
//               "grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg border",
//               SCOPE_TINT[activeKind],
//             )}
//           >
//             <ActiveIcon className="h-3.5 w-3.5" />
//           </span>
//           <span className="min-w-0 flex-1">
//             <span className="block truncate text-[13px] font-medium leading-tight text-ink">
//               {activeName}
//             </span>
//             <span className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-[11px]">
//               <span className="flex-shrink-0 rounded bg-canvas px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
//                 {SCOPE_META[activeKind].label}
//               </span>
//               {activeMeta && (
//                 <span className="truncate text-[10.5px] text-muted-foreground">
//                   {activeMeta}
//                 </span>
//               )}
//             </span>
//           </span>
//           {loadingId ? (
//             <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-muted-2" />
//           ) : (
//             <ChevronDown
//               className={cn(
//                 "h-3.5 w-3.5 flex-shrink-0 text-muted-2 transition-transform",
//                 open && "rotate-180 text-ink",
//               )}
//             />
//           )}
//         </button>
//       </div>
//
//       {popover &&
//         typeof document !== "undefined" &&
//         createPortal(popover as ReactNode, document.body)}
//
//       <Dialog
//         open={!!confirm}
//         onOpenChange={(o) => {
//           if (!o && !loadingId) setConfirm(null);
//         }}
//       >
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               Switch{" "}
//               {confirm ? SCOPE_META[confirm.kind].singular : "destination"}
//             </DialogTitle>
//             <DialogDescription>
//               Switch to <strong>{confirm?.data.name}</strong>? This will reload
//               the page.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="flex justify-end gap-3 pt-4">
//             <Button
//               variant="outline"
//               onClick={() => setConfirm(null)}
//               disabled={loadingId !== null}
//             >
//               Cancel
//             </Button>
//             <Button
//               onClick={handleConfirm}
//               disabled={loadingId !== null}
//               className="bg-primary text-white hover:bg-primary-dark"
//             >
//               {loadingId ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Switching...
//                 </>
//               ) : (
//                 "Confirm"
//               )}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

"use client";

/**
 * Top sidebar destination toggle.
 *
 */

import * as Sentry from "@sentry/nextjs";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Plus,
  Search as SearchIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  switchToLocation,
  switchToStore,
  switchToWarehouse,
} from "@/lib/actions/destination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Location } from "@/types/location/type";
import type { Store } from "@/types/store/type";
import type { Warehouses } from "@/types/warehouse/warehouse/type";

type ScopeKey = "location" | "warehouse" | "store";

type Active =
  | { kind: "location"; data: Location }
  | { kind: "store"; data: Store }
  | { kind: "warehouse"; data: Warehouses };

interface Props {
  locationList?: Location[] | null;
  currentLocation?: Location;
  storeList?: Store[];
  currentStore?: Store;
  warehouseList?: Warehouses[];
  warehouse?: Warehouses;
}

const SCOPE_META: Record<
  ScopeKey,
  { label: string; singular: string; icon: typeof MapPin }
> = {
  location: { label: "Locations", singular: "location", icon: MapPin },
  warehouse: {
    label: "Warehouses",
    singular: "warehouse",
    icon: WarehouseIcon,
  },
  store: { label: "Stores", singular: "store", icon: StoreIcon },
};

const SCOPE_TINT: Record<ScopeKey, string> = {
  location: "bg-primary/10 text-primary border-primary/30",
  warehouse: "bg-indigo-50 text-indigo-600 border-indigo-200",
  store: "bg-pos/10 text-pos border-pos/30",
};

// Route to navigate to when the user clicks "Add <singular>" per scope.
// Only location is wired for now; extend as other scopes get their own pages.
const ADD_ROUTES: Partial<Record<ScopeKey, string>> = {
  location: "/locations/new",
  // warehouse: "/warehouses/new",
  store: "stores/new",
};

export function SidebarLocationSwitcher({
  locationList,
  currentLocation,
  storeList,
  currentStore,
  warehouseList,
  warehouse,
}: Props) {
  const active: Active | null = useMemo(() => {
    if (warehouse?.id) return { kind: "warehouse", data: warehouse };
    if (currentStore?.id) return { kind: "store", data: currentStore };
    if (currentLocation?.id) return { kind: "location", data: currentLocation };
    return null;
  }, [warehouse, currentStore, currentLocation]);

  const [scope, setScope] = useState<ScopeKey>(active?.kind ?? "location");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const [confirm, setConfirm] = useState<Active | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && active) setScope(active.kind);
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ left: r.left, top: r.bottom + 8, width: r.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setQuery("");
  }, [scope, open]);

  const counts: Record<ScopeKey, number> = {
    location: locationList?.length ?? 0,
    warehouse: warehouseList?.length ?? 0,
    store: storeList?.length ?? 0,
  };
  const totalDestinations = counts.location + counts.warehouse + counts.store;

  const items = useMemo(() => {
    const base =
      scope === "location"
        ? (locationList ?? [])
        : scope === "warehouse"
          ? (warehouseList ?? [])
          : (storeList ?? []);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((it) => {
      const name = (it as { name?: string }).name?.toLowerCase() ?? "";
      const code = (it as { code?: string }).code?.toLowerCase() ?? "";
      const region = (it as { region?: string }).region?.toLowerCase() ?? "";
      return name.includes(q) || code.includes(q) || region.includes(q);
    });
  }, [scope, query, locationList, warehouseList, storeList]);

  const handlePick = useCallback(
    (dest: Active) => {
      if (active?.kind === dest.kind && active.data.id === dest.data.id) {
        setOpen(false);
        return;
      }
      setConfirm(dest);
      setOpen(false);
    },
    [active],
  );

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    setLoadingId(confirm.data.id);
    try {
      switch (confirm.kind) {
        case "location":
          await switchToLocation(confirm.data);
          break;
        case "store":
          await switchToStore(confirm.data);
          break;
        case "warehouse":
          await switchToWarehouse(confirm.data);
          break;
      }
      if (confirm.kind === "warehouse") {
        const wh = confirm.data;
        window.location.href = wh.active ? "/warehouse" : "/billing";
      } else if (confirm.kind === "store") {
        const st = confirm.data;
        // Active store → Stock items (no sales/analytics dashboard). An
        // inactive store has a lapsed plan → /billing to renew.
        window.location.href = st.active ? "/stock-variants" : "/billing";
      } else {
        const loc = confirm.data;
        window.location.href = loc.active
          ? "/dashboard"
          : `/subscription?location=${loc.id}`;
      }
    } catch (error) {
      // Surface the failure — a switch that closes the modal without
      // navigating is otherwise invisible to debug.
      console.error("Destination switch failed:", error);
      Sentry.captureException(error);
      setLoadingId(null);
      setConfirm(null);
    }
  }, [confirm]);

  if (totalDestinations <= 1 && !active) return null;

  const activeKind: ScopeKey = active?.kind ?? "location";
  const ActiveIcon = SCOPE_META[activeKind].icon;
  const activeName = active?.data.name ?? "Select destination";
  const activeMeta = active
    ? active.kind === "location"
      ? ((active.data as Location).region ?? "")
      : ((active.data as Store | Warehouses).code ?? "")
    : "";

  const popover = open && anchor && (
    <div
      ref={popRef}
      role="dialog"
      style={{
        position: "fixed",
        left: anchor.left,
        top: anchor.top,
        width: Math.max(anchor.width, 380),
        pointerEvents: "auto",
      }}
      className="z-[1100] flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[0_1px_0_rgba(20,17,12,0.04),0_24px_60px_-16px_rgba(20,17,12,0.30),0_6px_16px_-6px_rgba(20,17,12,0.10)]"
    >
      {/* segmented tabs */}
      <div
        role="tablist"
        className="m-0.5 grid grid-cols-3 gap-0.5 rounded-[9px] bg-canvas p-0.5"
      >
        {(Object.keys(SCOPE_META) as ScopeKey[]).map((key) => {
          const def = SCOPE_META[key];
          const isActive = scope === key;
          const Ico = def.icon;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setScope(key)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-[12px] tracking-tight transition-colors",
                isActive
                  ? "bg-card text-ink font-medium shadow-[0_1px_0_rgba(20,17,12,0.04),0_0_0_1px_hsl(var(--line))]"
                  : "text-muted-foreground hover:text-ink-2",
              )}
            >
              <Ico
                className={cn(
                  "h-3 w-3",
                  isActive ? "text-primary" : "text-current",
                )}
              />
              <span className="whitespace-nowrap">{def.label}</span>
              <span
                className={cn(
                  "rounded px-1 font-mono text-[10px]",
                  isActive
                    ? "bg-primary/15 text-primary border-transparent"
                    : "border border-line bg-card text-muted-2",
                )}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* search (only when there are enough rows to be worth filtering) */}
      {items.length > 4 || query ? (
        <div className="mx-1 mb-0.5 mt-1.5 flex items-center gap-2 rounded-lg border border-transparent bg-canvas px-2.5 py-1.5 transition-colors focus-within:border-primary focus-within:bg-card focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,hsl(var(--primary))_14%,transparent)]">
          <SearchIcon className="h-3.5 w-3.5 text-muted-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${SCOPE_META[scope].label.toLowerCase()}…`}
            className="flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-muted-2"
            autoFocus
          />
        </div>
      ) : null}

      {/* list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-1">
        {items.length === 0 && (
          <div className="px-2 py-6 text-center text-[12px] text-muted-foreground">
            {query
              ? `No ${SCOPE_META[scope].label.toLowerCase()} match "${query}"`
              : `No ${SCOPE_META[scope].label.toLowerCase()} yet`}
          </div>
        )}

        {items.map((it) => {
          const id = it.id;
          const isCurrent = active?.kind === scope && active.data.id === id;
          const itemActive = (it as { active?: boolean }).active !== false;
          const subline =
            scope === "location"
              ? ((it as Location).region ?? "")
              : scope === "warehouse"
                ? `${(it as Warehouses).code ?? ""}${(it as Warehouses).primary ? " · Primary" : ""}`
                : ((it as Store).code ?? "");

          const dest: Active =
            scope === "location"
              ? { kind: "location", data: it as Location }
              : scope === "warehouse"
                ? { kind: "warehouse", data: it as Warehouses }
                : { kind: "store", data: it as Store };

          return (
            <button
              key={id}
              onClick={() => handlePick(dest)}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                isCurrent ? "bg-primary/[0.07]" : "hover:bg-canvas",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border bg-canvas",
                  SCOPE_TINT[scope],
                  isCurrent && "bg-card border-primary/40",
                )}
              >
                {scope === "location" ? (
                  <MapPin className="h-3.5 w-3.5" />
                ) : scope === "warehouse" ? (
                  <WarehouseIcon className="h-3.5 w-3.5" />
                ) : (
                  <StoreIcon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13px] font-medium leading-tight text-ink">
                  <span className="truncate">
                    {(it as { name?: string }).name ?? "Unnamed"}
                  </span>
                  {!itemActive && (
                    <span className="flex-shrink-0 rounded border border-line bg-canvas px-1 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </span>
                {subline && (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {subline}
                  </span>
                )}
              </span>
              {isCurrent ? (
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
              ) : (
                <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-2 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              )}
            </button>
          );
        })}
      </div>

      {/* Add button — only shown for scopes that have a creation page */}
      {ADD_ROUTES[scope] && (
        <div className="mt-0.5 border-t border-line px-1 pb-1 pt-1.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.location.href = ADD_ROUTES[scope]!;
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-2 text-[12.5px] font-semibold text-primary-dark transition-colors hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add {SCOPE_META[scope].singular}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div ref={wrapRef} className="w-full">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={loadingId !== null}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2 py-2 text-left transition-colors",
            "hover:border-line-2 hover:bg-card",
            open &&
              "border-primary bg-card shadow-[0_0_0_3px_color-mix(in_oklab,hsl(var(--primary))_14%,transparent)]",
          )}
        >
          <span
            className={cn(
              "grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg border",
              SCOPE_TINT[activeKind],
            )}
          >
            <ActiveIcon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium leading-tight text-ink">
              {activeName}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-[11px]">
              <span className="flex-shrink-0 rounded bg-canvas px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                {SCOPE_META[activeKind].label}
              </span>
              {activeMeta && (
                <span className="truncate text-[10.5px] text-muted-foreground">
                  {activeMeta}
                </span>
              )}
            </span>
          </span>
          {loadingId ? (
            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-muted-2" />
          ) : (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 flex-shrink-0 text-muted-2 transition-transform",
                open && "rotate-180 text-ink",
              )}
            />
          )}
        </button>
      </div>

      {popover &&
        typeof document !== "undefined" &&
        createPortal(popover as ReactNode, document.body)}

      <Dialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o && !loadingId) setConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Switch{" "}
              {confirm ? SCOPE_META[confirm.kind].singular : "destination"}
            </DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirm?.data.name}</strong>? This will reload
              the page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={loadingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loadingId !== null}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              {loadingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
