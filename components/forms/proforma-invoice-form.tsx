"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Search,
  Package,
  Plus,
  Check,
  ChevronRight,
  User,
  ShoppingCart,
  Tag,
  Loader2,
  Trash2,
  CalendarDays,
  FileText,
  PercentIcon,
  UserPlus,
  Phone,
  Mail,
  UserCircle2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { searchCustomer, createCustomer } from "@/lib/actions/customer-actions";
import { searchProducts } from "@/lib/actions/product-actions";
import {
  createProforma,
  addItemsToProforma,
  removeItemsToProforma,
  updateProforma,
  editItemPriceOrQuantityToProforma,
} from "@/lib/actions/proforma-actions";
import { searchDiscount } from "@/lib/actions/discount-actions";
import { Proforma } from "@/types/proforma/type";
import { Customer } from "@/types/customer/type";
import { FormResponse } from "@/types/types";
import { Discount } from "@/types/discount/type";
import { Gender } from "@/types/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProformaProductVariant {
  id: string;
  name?: string;
  price?: number;
  sellingPrice?: number;
}

interface ProformaProduct {
  id: string;
  name: string;
  variants: ProformaProductVariant[];
  quantity: number | null;
}

interface LineItem {
  itemId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  unitTaxExclusivePrice: number;
  quantity: number;
}

interface BusinessInfo {
  businessName: string | null;
  locationName: string | null;
  locationAddress: string | null;
  locationPhoneNumber: string | null;
  locationLogo: string | null;
  tinNumber?: string | null;
}

interface ProformaState {
  id: string | null;
  proformaNumber: string | null;
  proformaStatus: string | null;
  customer: Pick<
    Customer,
    "id" | "firstName" | "lastName" | "email" | "phoneNumber"
  > | null;
  items: LineItem[];
  discount: number;
  discountId: string | null;
  notes: string;
  expiresAt: string;
  business: BusinessInfo | null;
  grossAmount: number;
  taxExclusiveGrossAmount: number;
  netAmount: number;
  taxAmount: number;
  showTaxBreakdown: boolean;
}

interface ProformaInvoiceFormProps {
  item?: Proforma | null;
}

// ─── Customer Schema ──────────────────────────────────────────────────────────

const CustomerSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(3, "Please enter a valid name"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(3, "Please enter a valid name"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  gender: z.nativeEnum(Gender),
});

type CustomerFormValues = z.infer<typeof CustomerSchema>;

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "Customer", icon: User },
  { num: 2, label: "Items", icon: ShoppingCart },
  { num: 3, label: "Details", icon: Tag },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        const Icon = s.icon;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  done
                    ? "bg-gray-700 text-white"
                    : active
                      ? "bg-gray-700 text-white shadow-lg"
                      : "bg-gray-100 text-gray-400"
                }`}
                style={
                  active
                    ? { boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }
                    : undefined
                }
              >
                {done ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active || done ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mb-4 transition-all duration-500 ${
                  current > s.num ? "bg-gray-700" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-gray-100 rounded-md animate-pulse ${className}`}
      style={style}
    />
  );
}

// ─── Proforma Preview Skeleton ────────────────────────────────────────────────

function ProformaPreviewSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-4">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="space-y-2 pt-0.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Separator className="mb-4" />
      <div className="mb-5">
        <Skeleton className="h-2 w-12 mb-2.5" />
        <div className="h-14 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
          <p className="text-gray-300 italic text-xs">
            Customer details will appear here
          </p>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between pb-2 border-b border-gray-100 gap-2">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-2.5 w-8" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        {[70, 85, 55].map((w, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-gray-50 gap-2"
          >
            <Skeleton className="h-2.5" style={{ width: `${w}px` }} />
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>
      <div className="flex justify-end mb-5 mt-3">
        <div className="w-52 space-y-2">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      <Separator className="mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-2.5 w-36" />
        <Skeleton className="h-2.5 w-8" />
      </div>
    </div>
  );
}

// ─── Create Customer Modal ────────────────────────────────────────────────────

function CreateCustomerModal({
  onCreated: _onCreated,
}: {
  onCreated: (customer: Customer) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"idle" | "customer">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);
  const isSubmitting = loadingPhase !== "idle";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: { gender: Gender.MALE },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setServerError(null);
    setLoadingPhase("customer");
    try {
      const result = await createCustomer({
        ...values,
        isCompanyAssociated: false,
        email: values.email || undefined,
        allowNotifications: false,
        status: true,
      });
      if (result?.responseType === "error") {
        setServerError(result.message ?? "Failed to create customer");
        setLoadingPhase("idle");
        return;
      }
    } catch (e: unknown) {
      setServerError(
        e instanceof Error
          ? e.message
          : "Something went wrong creating the customer",
      );
      setLoadingPhase("idle");
      return;
    }
    setLoadingPhase("idle");
    setSuccessName(values.firstName);
    reset();
    setTimeout(() => {
      setSuccessName(null);
      setOpen(false);
    }, 4000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          reset();
          setServerError(null);
          setSuccessName(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 h-11 w-11 border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-colors"
          title="Create new customer"
        >
          <UserPlus className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5 text-gray-700" />
            New Customer
          </DialogTitle>
        </DialogHeader>

        {successName ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Customer created successfully!
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please search for{" "}
                <span className="font-medium text-gray-700">{successName}</span>{" "}
                in the search box to select them.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              This dialog will close automatically…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {serverError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {serverError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-medium text-gray-700"
                >
                  First Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  className={`focus-visible:ring-gray-400 focus-visible:border-gray-400 ${errors.firstName ? "border-red-300" : "border-gray-200"}`}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-medium text-gray-700"
                >
                  Last Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  className={`focus-visible:ring-gray-400 focus-visible:border-gray-400 ${errors.lastName ? "border-red-300" : "border-gray-200"}`}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="phoneNumber"
                className="text-xs font-medium text-gray-700"
              >
                Phone Number <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  placeholder="+255 712 345 678"
                  {...register("phoneNumber")}
                  className={`pl-9 focus-visible:ring-gray-400 focus-visible:border-gray-400 ${errors.phoneNumber ? "border-red-300" : "border-gray-200"}`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-gray-700"
              >
                Email{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className={`pl-9 focus-visible:ring-gray-400 focus-visible:border-gray-400 ${errors.email ? "border-red-300" : "border-gray-200"}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Gender <span className="text-red-400">*</span>
              </Label>
              <Select
                value={watch("gender")}
                onValueChange={(v) => setValue("gender", v as Gender)}
              >
                <SelectTrigger
                  className={`focus:ring-gray-400 focus:border-gray-400 ${errors.gender ? "border-red-300" : "border-gray-200"}`}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.MALE}>Male</SelectItem>
                  <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-red-500">{errors.gender.message}</p>
              )}
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-700 hover:bg-gray-800 text-white min-w-[140px] shadow-sm"
              >
                {loadingPhase === "customer" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving
                    customer…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" /> Create Customer
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Existing Customer Row ────────────────────────────────────────────────────

function ExistingCustomerRow({
  customer,
  onSelect,
}: {
  customer: Customer;
  onSelect: () => Promise<void>;
}) {
  const [selecting, setSelecting] = useState(false);
  return (
    <button
      type="button"
      disabled={selecting}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors disabled:opacity-60"
      onClick={async () => {
        setSelecting(true);
        await onSelect();
        setSelecting(false);
      }}
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700 shrink-0 border border-gray-200">
        {selecting ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
        ) : (
          <>
            {customer.firstName?.[0]}
            {customer.lastName?.[0]}
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {customer.firstName} {customer.lastName}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {customer.phoneNumber}
          {customer.email ? ` · ${customer.email}` : ""}
        </p>
      </div>
      {selecting ? (
        <span className="text-[11px] text-gray-700 shrink-0">
          Creating proforma…
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      )}
    </button>
  );
}

// ─── Customer Search ──────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

function CustomerSearch({
  onSelect,
}: {
  onSelect: (c: Customer) => Promise<{ error?: string }>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string, pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await searchCustomer(q, pageNum, PAGE_SIZE);
      const content = res.content ?? [];
      const total = res.totalElements ?? content.length;
      setTotalCount(total);
      setResults((prev) => (append ? [...prev, ...content] : content));
      setHasMore(pageNum * PAGE_SIZE < total);
      setPage(pageNum);
    } catch {
      if (!append) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      search(query, 1, false);
    }, 300);
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleDropdownScroll = useCallback(() => {
    const el = dropdownRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60)
      search(query, page + 1, true);
  }, [loadingMore, hasMore, query, page, search]);

  const handleNewCustomer = useCallback(
    async (customer: Customer): Promise<{ error?: string }> => {
      setResults((prev) => [customer, ...prev]);
      return onSelect(customer);
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className="relative flex gap-2 items-start">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search customer by name or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (results.length === 0) search(query, 1, false);
          }}
          className="pl-9 h-11 border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>
      <CreateCustomerModal onCreated={handleNewCustomer} />
      {open && (
        <div
          ref={dropdownRef}
          onScroll={handleDropdownScroll}
          className="absolute left-0 z-50 w-[calc(100%-52px)] top-12 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto"
        >
          {!loading && totalCount > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {totalCount.toLocaleString()} customer
                {totalCount !== 1 ? "s" : ""} found
              </span>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    search("", 1, false);
                  }}
                  className="text-[11px] text-gray-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {loading && (
            <div className="p-2 space-y-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="py-8 flex flex-col items-center gap-2">
              <User className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">
                {query
                  ? `No customers matching "${query}"`
                  : "No customers yet"}
              </p>
              <p className="text-xs text-gray-300">
                Use the{" "}
                <span className="inline-flex items-center gap-0.5 text-gray-700">
                  <UserPlus className="w-3 h-3" /> button
                </span>{" "}
                to create one
              </p>
            </div>
          )}
          {results.map((c) => (
            <ExistingCustomerRow
              key={c.id}
              customer={c}
              onSelect={async () => {
                setOpen(false);
                setQuery("");
                await onSelect(c);
              }}
            />
          ))}
          {loadingMore && (
            <div className="py-3 flex justify-center border-t border-gray-100">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
          {!loadingMore && !hasMore && results.length > PAGE_SIZE && (
            <div className="py-2 text-center text-[11px] text-gray-300 border-t border-gray-100">
              All {totalCount.toLocaleString()} customers loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Product Variant Search ───────────────────────────────────────────────────

const PRODUCT_PAGE_SIZE = 15;

function ProductVariantSearch({
  onAdd,
}: {
  onAdd: (
    item: Omit<LineItem, "quantity" | "itemId">,
    quantity: number,
  ) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProformaProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Omit<
    LineItem,
    "quantity" | "itemId"
  > | null>(null);
  const [qty, setQty] = useState(1);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string, pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await searchProducts(q, pageNum, PRODUCT_PAGE_SIZE);
      const content = (res.content ?? []) as unknown as ProformaProduct[];
      const total = res.totalElements ?? content.length;
      setTotalCount(total);
      setResults(append ? (prev: ProformaProduct[]) => [...prev, ...content] : content);
      setHasMore(pageNum * PRODUCT_PAGE_SIZE < total);
      setPage(pageNum);
    } catch {
      if (!append) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (open) search(query, 1, false);
    }, 300);
  }, [query, search, open]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleDropdownScroll = useCallback(() => {
    const el = dropdownRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60)
      search(query, page + 1, true);
  }, [loadingMore, hasMore, query, page, search]);

  const selectVariant = (p: ProformaProduct, v: ProformaProductVariant) => {
    const unitPrice = v.sellingPrice ?? v.price ?? 0;
    setPending({
      variantId: v.id,
      productName: p.name,
      variantName: v.name ?? "",
      unitPrice,
      // Before the API responds we don't know the server-computed ex-tax price,
      // so we optimistically set it equal; it will be overwritten from the payload.
      unitTaxExclusivePrice: unitPrice,
    });
    setQty(1);
    setOpen(false);
    setQuery("");
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setAdding(true);
    await onAdd(pending, qty);
    setAdding(false);
    setPending(null);
    setQty(1);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  const rows: { product: ProformaProduct; variant: ProformaProductVariant }[] = results.flatMap(
    (p) =>
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({ product: p, variant: v }))
        : [{ product: p, variant: { id: p.id } as ProformaProductVariant }],
  );

  return (
    <div ref={containerRef} className="space-y-3">
      {!pending ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search product or variant…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                if (results.length === 0) search(query, 1, false);
              }}
              className="pl-9 h-11 border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          {open && (
            <div
              ref={dropdownRef}
              onScroll={handleDropdownScroll}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto"
            >
              {!loading && totalCount > 0 && (
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {totalCount.toLocaleString()} product
                    {totalCount !== 1 ? "s" : ""}
                    {query ? ` matching "${query}"` : ""}
                  </span>
                  {hasMore && (
                    <span className="text-[11px] text-gray-700">
                      Scroll for more
                    </span>
                  )}
                </div>
              )}
              {loading && (
                <div className="divide-y divide-gray-50">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 bg-gray-100 animate-pulse rounded w-2/3" />
                        <div className="h-2 bg-gray-100 animate-pulse rounded w-1/3" />
                      </div>
                      <div className="h-2.5 bg-gray-100 animate-pulse rounded w-16 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              {!loading && rows.length === 0 && (
                <div className="py-10 flex flex-col items-center gap-2 text-gray-300">
                  <Package className="w-8 h-8" />
                  <p className="text-xs">
                    No products found{query ? ` for "${query}"` : ""}
                  </p>
                </div>
              )}
              {!loading &&
                rows.map(({ product: p, variant: v }) => {
                  const price = v.sellingPrice ?? v.price ?? 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors"
                      onClick={() => selectVariant(p, v)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-gray-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate font-medium">
                            {p.name}
                          </p>
                          {v.name && (
                            <p className="text-xs text-gray-400 truncate">
                              {v.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {price > 0 && (
                        <span className="text-sm font-semibold text-gray-700 shrink-0">
                          {fmt(price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              {loadingMore && (
                <div className="py-3 flex justify-center border-t border-gray-100">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {!loadingMore && !hasMore && rows.length > PRODUCT_PAGE_SIZE && (
                <div className="py-2 text-center text-[11px] text-gray-300 border-t border-gray-100">
                  All {totalCount.toLocaleString()} products loaded
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {pending.productName}
                {pending.variantName && (
                  <span className="text-gray-500 font-normal">
                    {" "}
                    — {pending.variantName}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Unit price:{" "}
                <span className="font-semibold text-gray-700">
                  {fmt(pending.unitPrice)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              disabled={adding}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
              <button
                type="button"
                disabled={adding}
                className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium disabled:opacity-40"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                disabled={adding}
                onChange={(e) =>
                  setQty(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-14 text-center text-sm font-bold border-x py-2 focus:outline-none disabled:bg-gray-50"
              />
              <button
                type="button"
                disabled={adding}
                className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium disabled:opacity-40"
                onClick={() => setQty(qty + 1)}
              >
                +
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-gray-900">
                {fmt(pending.unitPrice * qty)}
              </span>
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
            onClick={handleConfirm}
            disabled={adding}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding to
                proforma…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Add to Proforma
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Discount Search ──────────────────────────────────────────────────────────

function DiscountSearch({ onSelect }: { onSelect: (d: Discount) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Discount[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await searchDiscount(q, 1, 20);
      setResults(res.content ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search available discounts…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (!query) search("");
          }}
          className="pl-9 h-10 border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
        />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-auto">
          {loading && (
            <div className="p-3 text-xs text-gray-500 text-center">
              Loading…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-3 text-xs text-gray-500 text-center">
              No discounts found
            </div>
          )}
          {results.map((d) => {
            const valueLabel =
              d.discountType === "PERCENTAGE"
                ? `${d.discountValue}%`
                : new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: "TZS",
                    minimumFractionDigits: 0,
                  }).format(d.discountValue);
            return (
              <button
                key={d.id}
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors"
                onClick={() => {
                  onSelect(d);
                  setQuery(d.name);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <PercentIcon className="w-4 h-4 text-gray-700 shrink-0" />
                  <span className="text-sm text-gray-900">{d.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">
                  {valueLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Edit Item Panel ──────────────────────────────────────────────────────────

function EditItemPanel({
  item,
  onSave,
  onCancel,
}: {
  item: LineItem;
  onSave: (
    itemId: string,
    quantity: number,
    unitCustomPrice: number,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(item.quantity);
  const [customPrice, setCustomPrice] = useState<string>(
    String(item.unitPrice),
  );
  const [saving, setSaving] = useState(false);

  const unitPrice = parseFloat(customPrice) || 0;
  const priceChanged = unitPrice !== item.unitPrice;
  const qtyChanged = qty !== item.quantity;
  const hasChanges = priceChanged || qtyChanged;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    await onSave(item.itemId, qty, unitPrice);
    setSaving(false);
  };

  return (
    <div className="mt-1 mb-2 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center">
            <Pencil className="w-3 h-3 text-gray-700" />
          </div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Edit Item
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Quantity</label>
          <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              disabled={saving || qty <= 1}
              className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium disabled:opacity-40 transition-colors"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              disabled={saving}
              onChange={(e) =>
                setQty(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full text-center text-sm font-bold border-x py-2 focus:outline-none disabled:bg-gray-50"
            />
            <button
              type="button"
              disabled={saving}
              className="px-3 py-2 text-gray-500 hover:bg-gray-50 text-lg font-medium disabled:opacity-40 transition-colors"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
          {qtyChanged && (
            <p className="text-[10px] text-gray-700">Was: {item.quantity}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">
            Unit Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
              TZS
            </span>
            <Input
              type="number"
              min={0}
              value={customPrice}
              disabled={saving}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="pl-10 h-[38px] bg-white text-sm border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
              placeholder="0"
            />
          </div>
          {priceChanged && (
            <p className="text-[10px] text-gray-700">
              Was: {fmt(item.unitPrice)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 text-sm">
        <span className="text-gray-500 text-xs">New Line Total</span>
        <span className="font-bold text-gray-900">{fmt(unitPrice * qty)}</span>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-9 text-sm border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1 h-9 text-sm bg-gray-700 hover:bg-gray-800 text-white shadow-sm disabled:opacity-50"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Details Step ─────────────────────────────────────────────────────────────

function DetailsStep({
  grossTotal,
  pending,
  isEditing,
  initialNote,
  initialExpiresAt,
  initialDiscount,
  showTaxBreakdown,
  onTaxBreakdownChange,
  onSave,
  onBack,
}: {
  grossTotal: number;
  pending: boolean;
  isEditing: boolean;
  initialNote: string;
  initialExpiresAt: string;
  initialDiscount: number;
  showTaxBreakdown: boolean;
  onTaxBreakdownChange: (v: boolean) => void;
  onSave: (opts: {
    notes: string;
    expiresAt: string;
    discountId: string | null;
    manualDiscountAmount: number;
  }) => Promise<void>;
  onBack: () => void;
}) {
  const [notes, setNote] = useState(initialNote);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [applyDiscount, setApplyDiscount] = useState<boolean | null>(
    initialDiscount > 0 ? true : null,
  );
  const [discountSource, setDiscountSource] = useState<"api" | "manual">(
    initialDiscount > 0 ? "manual" : "api",
  );
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null,
  );
  const [manualAmount, setManualAmount] = useState(
    initialDiscount > 0 ? String(initialDiscount) : "",
  );
  const [saved, setSaved] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  const effectiveDiscountAmount = (() => {
    if (!applyDiscount || (!selectedDiscount && !manualAmount)) return 0;
    if (discountSource === "api" && selectedDiscount) {
      return selectedDiscount.discountType === "PERCENTAGE"
        ? Math.round((grossTotal * selectedDiscount.discountValue) / 100)
        : selectedDiscount.discountValue;
    }
    return parseFloat(manualAmount) || 0;
  })();

  const netTotal = Math.max(0, grossTotal - effectiveDiscountAmount);
  const hasValidDiscount =
    discountSource === "api"
      ? !!selectedDiscount
      : (parseFloat(manualAmount) || 0) > 0;
  const canSave = !applyDiscount || (applyDiscount && hasValidDiscount);

  const handleSave = async () => {
    await onSave({
      notes,
      expiresAt,
      discountId:
        discountSource === "api" ? (selectedDiscount?.id ?? null) : null,
      manualDiscountAmount:
        discountSource === "manual" ? parseFloat(manualAmount) || 0 : 0,
    });
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Final Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Add notes, expiry date and optional discount
        </p>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <FileText className="w-4 h-4 text-gray-400" /> Note{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Textarea
          placeholder="Payment should be wired through our bank account…"
          value={notes}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          className="resize-none text-sm border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
          rows={3}
        />
      </div>

      {/* Expires At */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <CalendarDays className="w-4 h-4 text-gray-400" /> Expires At{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Input
          type="date"
          value={expiresAt}
          onChange={(e) => {
            setExpiresAt(e.target.value);
            setSaved(false);
          }}
          className="h-10 border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
        />
      </div>

      <Separator className="bg-gray-200" />

      {/* ── Tax breakdown toggle ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <PercentIcon className="w-3.5 h-3.5 text-gray-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Show tax breakdown
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Reveals pre-tax and VAT lines on the invoice
            </p>
          </div>
        </div>
        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={showTaxBreakdown}
          onClick={() => onTaxBreakdownChange(!showTaxBreakdown)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
            showTaxBreakdown ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              showTaxBreakdown ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <Separator className="bg-gray-200" />

      {/* Discount toggle */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Apply a discount?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Yes, apply discount",
              sub: "From list or manual entry",
              value: true,
            },
            {
              label: "No discount",
              sub: "Proceed at full price",
              value: false,
            },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                setApplyDiscount(opt.value);
                setSaved(false);
              }}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                applyDiscount === opt.value
                  ? opt.value
                    ? "border-gray-700 bg-gray-50"
                    : "border-gray-300 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  applyDiscount === opt.value
                    ? opt.value
                      ? "text-gray-700"
                      : "text-gray-800"
                    : "text-gray-600"
                }`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {applyDiscount === true && (
        <div className="space-y-4">
          {/* Source toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(["api", "manual"] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  setDiscountSource(src);
                  setSelectedDiscount(null);
                  setManualAmount("");
                  setSaved(false);
                }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                  discountSource === src
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {src === "api"
                  ? "From available discounts"
                  : "Manual amount (TZS)"}
              </button>
            ))}
          </div>

          {discountSource === "api" ? (
            <>
              <DiscountSearch
                onSelect={(d) => {
                  setSelectedDiscount(d);
                  setSaved(false);
                }}
              />
              {selectedDiscount && (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PercentIcon className="w-4 h-4 text-gray-700" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedDiscount.name}
                      </p>
                      <p className="text-xs text-gray-700">
                        {selectedDiscount.discountType === "PERCENTAGE"
                          ? `${selectedDiscount.discountValue}% off`
                          : fmt(selectedDiscount.discountValue) + " off"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDiscount(null);
                      setSaved(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                TZS
              </span>
              <Input
                type="number"
                placeholder="Enter discount amount"
                value={manualAmount}
                onChange={(e) => {
                  setManualAmount(e.target.value);
                  setSaved(false);
                }}
                className="pl-12 h-10 border-gray-200 focus-visible:ring-gray-400 focus-visible:border-gray-400"
              />
            </div>
          )}

          {effectiveDiscountAmount > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Gross Total</span>
                <span>{fmt(grossTotal)}</span>
              </div>
              <div className="flex justify-between text-red-500 font-medium">
                <span>Discount</span>
                <span>− {fmt(effectiveDiscountAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Net Total</span>
                <span>{fmt(netTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        className="w-full bg-gray-700 hover:bg-gray-800 text-white h-11 shadow-sm font-medium"
        disabled={pending || !canSave}
        onClick={handleSave}
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
          </>
        ) : isEditing ? (
          "Update Details"
        ) : (
          "Save Details"
        )}
      </Button>

      {saved && (
        <div className="flex items-center gap-2 text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Check className="w-4 h-4" /> Details{" "}
          {isEditing ? "updated" : "saved"} successfully
        </div>
      )}

      <div className="flex justify-between pt-1">
        <Button
          variant="outline"
          type="button"
          onClick={onBack}
          className="border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Back
        </Button>
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function ProformaPreview({ state }: { state: ProformaState }) {
  if (!state.customer) return <ProformaPreviewSkeleton />;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 2,
    }).format(n);

  const fmtDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Use server-computed totals when available, fall back to client-computed values.
  const grossAmount =
    state.grossAmount > 0
      ? state.grossAmount
      : state.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);

  const taxExclusiveGrossAmount =
    state.taxExclusiveGrossAmount > 0
      ? state.taxExclusiveGrossAmount
      : state.items.reduce(
          (s, it) => s + it.unitTaxExclusivePrice * it.quantity,
          0,
        );

  // Use the server-returned taxAmount directly — no client-side calculation needed.
  const taxAmount = state.taxAmount;

  const netAmount =
    state.netAmount > 0
      ? state.netAmount
      : Math.max(0, grossAmount - (state.discount ?? 0));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-[12.5px] sticky top-4 transition-all duration-300">
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-start gap-3">
          {state.business?.locationLogo && (
            <img
              src={state.business.locationLogo}
              alt="Business logo"
              className="w-10 h-10 rounded-lg object-contain border border-gray-100 shrink-0"
            />
          )}
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {state.business?.businessName ?? "—"}
            </p>
            {state.business?.locationName && (
              <p className="text-gray-500 text-[11px] font-medium">
                {state.business.locationName}
              </p>
            )}
            {state.business?.locationAddress && (
              <p className="text-gray-400 text-[11px]">
                {state.business.locationAddress}
              </p>
            )}
            {state.business?.locationPhoneNumber && (
              <p className="text-gray-400 text-[11px]">
                {state.business.locationPhoneNumber}
              </p>
            )}
            {state.business?.tinNumber && (
              <p className="text-gray-300 text-[11px] mt-0.5">
                TIN: {state.business.tinNumber}
              </p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
            Proforma Invoice
          </span>
          {state.proformaNumber ? (
            <p className="text-gray-400 text-[11px] mt-1.5">
              #{state.proformaNumber}
            </p>
          ) : (
            <div className="mt-1.5 h-3 w-28 bg-gray-100 rounded animate-pulse ml-auto" />
          )}
          {state.expiresAt && (
            <p className="text-gray-400 text-[11px] mt-1">
              Expires: {fmtDate(state.expiresAt)}
            </p>
          )}
          {state.proformaStatus && (
            <p className="text-gray-400 text-[11px] mt-1">
              Status: {state.proformaStatus}
            </p>
          )}
        </div>
      </div>

      <Separator className="mb-4 bg-gray-100" />

      {/* ── Bill To ── */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1.5">
          Bill To
        </p>
        <div className="space-y-0.5">
          <p className="font-bold text-gray-900">
            {state.customer.firstName} {state.customer.lastName}
          </p>
          {state.customer.email && (
            <p className="text-gray-500">{state.customer.email}</p>
          )}
          {state.customer.phoneNumber && (
            <p className="text-gray-500">{state.customer.phoneNumber}</p>
          )}
        </div>
      </div>

      {/* ── Line items ── */}
      <div className="mb-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Item", "Qty", "Price", "Total"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 text-[10px] uppercase tracking-wider text-gray-400 font-semibold ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <ShoppingCart className="w-6 h-6 text-gray-200" />
                    <p className="text-gray-300 italic text-xs">No items yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              state.items.map((it) => (
                <tr key={it.itemId} className="border-b border-gray-50">
                  <td className="py-2 text-gray-800">
                    {it.productName}
                    {it.variantName && (
                      <span className="text-gray-400"> — {it.variantName}</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {it.quantity.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {/* Show ex-tax price per unit when breakdown is toggled on */}
                    {state.showTaxBreakdown
                      ? fmt(it.unitTaxExclusivePrice)
                      : fmt(it.unitPrice)}
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {state.showTaxBreakdown
                      ? fmt(it.unitTaxExclusivePrice * it.quantity)
                      : fmt(it.unitPrice * it.quantity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="flex justify-end mb-5">
        <div className="w-56 space-y-1.5 text-[12.5px]">
          {state.showTaxBreakdown ? (
            <>
              {/* Tax-exclusive subtotal */}
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (excl. VAT)</span>
                <span>{fmt(taxExclusiveGrossAmount)}</span>
              </div>
              {/* VAT line */}
              <div className="flex justify-between text-emerald-600 font-medium">
                <span className="flex items-center gap-1">
                  VAT
                  <span className="text-[10px] text-gray-400 font-normal">
                    (18%)
                  </span>
                </span>
                <span>+ {fmt(taxAmount)}</span>
              </div>
              {/* Gross (tax-inclusive total) */}
              <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-1.5">
                <span>Gross (incl. VAT)</span>
                <span>{fmt(grossAmount)}</span>
              </div>
              {/* Discount if any */}
              {state.discount > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount</span>
                  <span>− {fmt(state.discount)}</span>
                </div>
              )}
              {/* Net payable */}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total payable</span>
                <span>{fmt(netAmount)}</span>
              </div>
            </>
          ) : (
            <>
              {/* Standard view — no tax lines */}
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{fmt(grossAmount)}</span>
              </div>
              {state.discount > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount</span>
                  <span>− {fmt(state.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span>{fmt(netAmount)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tax notice badge (only when breakdown is shown) ── */}
      {state.showTaxBreakdown && taxAmount > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
          <PercentIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-700">
            Prices are <span className="font-semibold">VAT-inclusive</span> at
            18%. Tax amount:{" "}
            <span className="font-semibold">{fmt(taxAmount)}</span>
          </p>
        </div>
      )}

      {/* ── Note ── */}
      {state.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
            Note
          </p>
          <p className="text-gray-600 text-[11px]">{state.notes}</p>
        </div>
      )}

      <Separator className="mb-3 bg-gray-100" />
      <div className="mt-4 flex justify-between text-[10px] text-gray-400">
        <span>Powered by Settlo Technologies Ltd</span>
        <span>v1.0.0</span>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function ProformaWizard({ item }: ProformaInvoiceFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(item ? 3 : 1);
  const [error, setError] = useState<string | null>(null);
  const [detailsPending, setDetailsPending] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [state, setState] = useState<ProformaState>(() => {
    if (!item) {
      return {
        id: null,
        proformaNumber: null,
        proformaStatus: null,
        customer: null,
        items: [],
        discount: 0,
        discountId: null,
        notes: "",
        expiresAt: "",
        business: null,
        grossAmount: 0,
        taxExclusiveGrossAmount: 0,
        taxAmount: 0,
        netAmount: 0,
        showTaxBreakdown: false,
      };
    }
    return {
      id: item.id,
      proformaNumber: item.proformaNumber,
      proformaStatus: item.proformaStatus,
      customer: {
        id: item.customer,
        firstName: item.customerFirstName,
        lastName: item.customerLastName,
        email: item.customerEmail,
        phoneNumber: item.customerPhoneNumber,
      },
      items: item.items.map((i) => ({
        itemId: i.id,
        variantId: i.id,
        productName: i.productName,
        variantName: i.productVariantName,
        unitPrice: i.unitPrice,
        unitTaxExclusivePrice: i.unitTaxExclusivePrice ?? i.unitPrice,
        quantity: i.quantity,
      })),
      discount:
        (item as any).totalDiscountAmount ?? item.appliedDiscountAmount ?? 0,
      discountId: (item as any).appliedDiscountId ?? null,
      notes: item.notes ?? "",
      expiresAt: item.expiresAt ? String(item.expiresAt).split("T")[0] : "",
      showTaxBreakdown: (item as any).showTaxAmounts ?? false,
      business: {
        businessName: item.businessName ?? null,
        locationName: item.locationName ?? null,
        locationAddress: item.locationAddress ?? null,
        locationPhoneNumber: item.locationPhoneNumber ?? null,
        locationLogo: item.locationLogo ?? null,
      },
      grossAmount: (item as any).grossAmount ?? 0,
      taxExclusiveGrossAmount: (item as any).taxExclusiveGrossAmount ?? 0,
      taxAmount: (item as any).taxAmount ?? 0,
      netAmount: (item as any).netAmount ?? 0,
    };
  });

  const handleCustomerSelect = useCallback(
    async (customer: Customer): Promise<{ error?: string }> => {
      setError(null);
      const result: void | FormResponse<any> = await createProforma({
        customer: customer.id,
      });
      if (result?.responseType === "error") {
        setError(result.message);
        return { error: result.message };
      }
      const proformaId = result?.data?.id;
      const proformaNumber = result?.data?.proformaNumber;
      if (!proformaId) {
        const msg = "Could not retrieve proforma ID — please try again";
        setError(msg);
        return { error: msg };
      }
      const business: BusinessInfo = {
        businessName: result.data.businessName ?? null,
        locationName: result.data.locationName ?? null,
        locationAddress: result.data.locationAddress ?? null,
        locationPhoneNumber: result.data.locationPhoneNumber ?? null,
        locationLogo: result.data.locationLogo ?? null,
        tinNumber: result.data.tinNumber ?? null,
      };
      setState((prev) => ({
        ...prev,
        id: proformaId,
        proformaNumber,
        customer,
        business,
      }));
      setStep(2);
      return {};
    },
    [],
  );

  const handleAddItem = useCallback(
    async (
      newItem: Omit<LineItem, "quantity" | "itemId">,
      quantity: number,
    ) => {
      if (!state.id) return;
      setError(null);
      const result = await addItemsToProforma(state.id, {
        productVariantId: newItem.variantId,
        quantity,
      });
      if (result?.responseType === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      const data = result?.data as any;
      const itemId: string = data?.id ?? newItem.variantId;
      const unitTaxExclusivePrice: number =
        data?.unitTaxExclusivePrice ?? newItem.unitTaxExclusivePrice;
      setState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { ...newItem, itemId, quantity, unitTaxExclusivePrice },
        ],
        grossAmount: data?.grossAmount ?? prev.grossAmount,
        taxExclusiveGrossAmount:
          data?.taxExclusiveGrossAmount ?? prev.taxExclusiveGrossAmount,
        taxAmount: data?.taxAmount ?? prev.taxAmount,
        netAmount: data?.netAmount ?? prev.netAmount,
      }));
      toast.success("Item added");
    },
    [state.id],
  );

  const handleRemoveItem = useCallback(
    async (index: number) => {
      const lineItem = state.items[index];
      if (!state.id || !lineItem) return;
      setError(null);
      setRemovingIndex(index);
      if (editingIndex === index) setEditingIndex(null);
      const result = await removeItemsToProforma(state.id, lineItem.itemId);
      setRemovingIndex(null);
      if (result?.responseType === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      const data = result?.data as any;
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
        grossAmount: data?.grossAmount ?? prev.grossAmount,
        taxExclusiveGrossAmount:
          data?.taxExclusiveGrossAmount ?? prev.taxExclusiveGrossAmount,
        taxAmount: data?.taxAmount ?? prev.taxAmount,
        netAmount: data?.netAmount ?? prev.netAmount,
      }));
      toast.success("Item removed");
    },
    [state.id, state.items, editingIndex],
  );

  const handleEditItem = useCallback(
    async (itemId: string, quantity: number, unitCustomPrice: number) => {
      if (!state.id) return;
      setError(null);
      const result = await editItemPriceOrQuantityToProforma(
        state.id,
        itemId,
        quantity,
        unitCustomPrice,
      );
      if (result?.responseType === "error") {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      const data = result?.data as any;
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.itemId === itemId
            ? {
                ...it,
                quantity,
                unitPrice: unitCustomPrice,
                unitTaxExclusivePrice:
                  data?.unitTaxExclusivePrice ?? it.unitTaxExclusivePrice,
              }
            : it,
        ),
        grossAmount: data?.grossAmount ?? prev.grossAmount,
        taxExclusiveGrossAmount:
          data?.taxExclusiveGrossAmount ?? prev.taxExclusiveGrossAmount,
        taxAmount: data?.taxAmount ?? prev.taxAmount,
        netAmount: data?.netAmount ?? prev.netAmount,
      }));
      setEditingIndex(null);
      toast.success("Item updated");
    },
    [state.id],
  );

  const handleSaveDetails = useCallback(
    async (opts: {
      notes: string;
      expiresAt: string;
      discountId: string | null;
      manualDiscountAmount: number;
    }) => {
      if (!state.id) return;
      setError(null);
      setDetailsPending(true);
      const result = await updateProforma(
        state.id,
        opts.notes,
        opts.discountId ?? "",
        opts.manualDiscountAmount,
        opts.expiresAt,
        state.showTaxBreakdown, // ✅ driven by the toggle in state
      );
      setDetailsPending(false);
      if (result?.responseType === "error") {
        setError(result.message);
        return;
      }
      const data = result?.data as Record<string, unknown> | undefined;
      const appliedDiscount =
        typeof data?.totalDiscountAmount === "number" &&
        data.totalDiscountAmount > 0
          ? data.totalDiscountAmount
          : opts.manualDiscountAmount;
      setState((prev) => ({
        ...prev,
        notes: opts.notes,
        expiresAt: opts.expiresAt,
        discountId: opts.discountId,
        discount: appliedDiscount,
        // ✅ Persist the API-confirmed value back into state
        showTaxBreakdown:
          typeof data?.showTaxAmounts === "boolean"
            ? data.showTaxAmounts
            : prev.showTaxBreakdown,
        grossAmount:
          typeof data?.grossAmount === "number"
            ? data.grossAmount
            : prev.grossAmount,
        taxExclusiveGrossAmount:
          typeof data?.taxExclusiveGrossAmount === "number"
            ? data.taxExclusiveGrossAmount
            : prev.taxExclusiveGrossAmount,
        taxAmount:
          typeof data?.taxAmount === "number" ? data.taxAmount : prev.taxAmount,
        netAmount:
          typeof data?.netAmount === "number" ? data.netAmount : prev.netAmount,
      }));
      toast.success("Proforma updated successfully");
      router.push(`/proforma-invoice/details/${state.id}`);
    },
    [state.id, state.showTaxBreakdown, router], // ✅ depend on showTaxBreakdown
  );

  const grossTotal = state.items.reduce(
    (s, it) => s + it.unitPrice * it.quantity,
    0,
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Form Card ── */}
      <Card className="border-gray-200 shadow-sm bg-white">
        <CardContent className="pt-6">
          <StepIndicator current={step} />

          {error && (
            <Alert
              variant="destructive"
              className="mb-5 border-red-200 bg-red-50 text-red-700"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Select Customer
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Search from your customer list or create a new one
                </p>
              </div>
              <div className="relative">
                <CustomerSearch onSelect={handleCustomerSelect} />
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Add Items
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Search and add products — repeat for each item
                </p>
              </div>

              {state.customer && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {state.customer.firstName} {state.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {state.customer.phoneNumber}
                      {state.customer.email ? ` · ${state.customer.email}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 bg-white border border-gray-200 rounded px-1.5 py-0.5 shrink-0">
                    Customer
                  </span>
                </div>
              )}

              <div className="relative">
                <ProductVariantSearch onAdd={handleAddItem} />
              </div>

              {state.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-300">
                  <ShoppingCart className="w-8 h-8" />
                  <p className="text-xs">
                    No items yet — search above to add products
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Added items
                    </p>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                      {state.items.length}
                    </span>
                  </div>

                  {state.items.map((it, i) => (
                    <div key={it.itemId}>
                      <div
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300 ${
                          removingIndex === i
                            ? "opacity-40 bg-red-50 border-red-100 scale-95"
                            : editingIndex === i
                              ? "bg-gray-50 border-gray-300"
                              : "bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                            <Package className="w-3.5 h-3.5 text-gray-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {it.productName}
                              {it.variantName && (
                                <span className="text-gray-400 font-normal">
                                  {" "}
                                  — {it.variantName}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">
                              {it.quantity} × {fmt(it.unitPrice)}
                              {" = "}
                              <span className="font-semibold text-gray-700">
                                {fmt(it.unitPrice * it.quantity)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingIndex(editingIndex === i ? null : i)
                            }
                            disabled={removingIndex !== null}
                            title={
                              editingIndex === i
                                ? "Close editor"
                                : "Edit quantity or price"
                            }
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                              editingIndex === i
                                ? "text-gray-700 bg-gray-100 border border-gray-200"
                                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(i)}
                            disabled={removingIndex !== null}
                            title="Remove item"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            {removingIndex === i ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {editingIndex === i && state.id && (
                        <EditItemPanel
                          item={it}
                          onSave={handleEditItem}
                          onCancel={() => setEditingIndex(null)}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-sm mt-1">
                    <span className="text-gray-500">Gross Total</span>
                    <span className="font-bold text-gray-900">
                      {fmt(grossTotal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(item ? 3 : 1)}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={state.items.length === 0 || removingIndex !== null}
                  onClick={() => setStep(3)}
                  className="bg-gray-700 hover:bg-gray-800 text-white shadow-sm"
                  title={
                    state.items.length === 0
                      ? "Add at least one item to continue"
                      : undefined
                  }
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <DetailsStep
              grossTotal={grossTotal}
              pending={detailsPending}
              isEditing={!!item}
              initialNote={state.notes}
              initialExpiresAt={state.expiresAt}
              initialDiscount={state.discount}
              showTaxBreakdown={state.showTaxBreakdown}
              onTaxBreakdownChange={(v) =>
                setState((prev) => ({ ...prev, showTaxBreakdown: v }))
              }
              onSave={handleSaveDetails}
              onBack={() => setStep(2)}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Preview ── */}
      <div className="hidden lg:block">
        <ProformaPreview state={state} />
      </div>
    </div>
  );
}
