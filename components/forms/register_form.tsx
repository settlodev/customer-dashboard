"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import { RegisterSchema } from "@/types/data-schemas";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BusinessTimeType } from "@/types/types";
import { FormError } from "../widgets/form-error";
import { FormSuccess } from "../widgets/form-success";
import {
  register,
  verifyEmailCode,
  resendVerificationCode,
} from "@/lib/actions/auth-actions";
import {
  createBusinessWithLocations,
  OperatingHoursEntry,
  LocationInput,
} from "@/lib/actions/auth/business";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ArrowRight,
  Building2,
  User,
  Mail,
  KeyRound,
  MapPin,
  Clock,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BusinessSchema } from "@/types/business/schema";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import BusinessTypeSelector from "@/components/widgets/business-type-selector";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "../ui/phone-input";
import { businessTimes } from "@/types/constants";
import { useSession } from "next-auth/react";
import UploadImageWidget from "@/components/widgets/UploadImageWidget";
import CountrySelector from "@/components/widgets/country-selector";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import SocialAuthButtons from "@/components/widgets/social-auth-buttons";
import Link from "next/link";

const defaultCountry = process.env.DEFAULT_COUNTRY;

// Simplified schema for step 3 — no separate locationName needed
const BusinessSetupSchema = BusinessSchema.omit({
  id: true,
  identificationNumber: true,
  certificateOfIncorporation: true,
  businessIdentificationDocument: true,
  businessLicense: true,
  memarts: true,
  vrn: true,
  serial: true,
  uin: true,
  receiptPrefix: true,
  receiptSuffix: true,
  receiptImage: true,
  logo: true,
  notificationPhone: true,
  notificationEmailAddress: true,
  website: true,
  facebook: true,
  instagram: true,
  twitter: true,
  linkedin: true,
  youtube: true,
  tiktok: true,
  vfdRegistrationState: true,
  status: true,
  primaryColor: true,
  secondaryColor: true,
  bannerImageUrl: true,
  faviconUrl: true,
  fontFamily: true,
  metaTitle: true,
  metaDescription: true,
  shareImageUrl: true,
}).extend({
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// ── Operating hours defaults ──────────────────────────────────────

const DAYS_OF_WEEK = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
  "FRIDAY", "SATURDAY", "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday",
  FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

function getDefaultOperatingHours(): OperatingHoursEntry[] {
  return DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day,
    openTime: "08:00",
    closeTime: "21:00",
    closed: day === "SUNDAY",
  }));
}

// ── Location entry for multi-location mode ────────────────────────

interface LocationFormEntry {
  id: string; // client-side key
  name: string;
  city: string;
  address: string;
  operatingHours: OperatingHoursEntry[];
  hoursExpanded: boolean;
}

function createEmptyLocation(): LocationFormEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    city: "",
    address: "",
    operatingHours: getDefaultOperatingHours(),
    hoursExpanded: false,
  };
}

// ── Operating hours compact display ───────────────────────────────

function OperatingHoursTable({
  hours,
  onChange,
  disabled,
}: {
  hours: OperatingHoursEntry[];
  onChange: (hours: OperatingHoursEntry[]) => void;
  disabled: boolean;
}) {
  const update = (dayOfWeek: string, field: keyof OperatingHoursEntry, value: string | boolean) => {
    onChange(hours.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)));
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        <span className="w-24 shrink-0">Day</span>
        <span className="w-10 shrink-0">Open</span>
        <span className="flex-1">From</span>
        <span className="flex-1">To</span>
      </div>
      {hours.map((entry) => (
        <div
          key={entry.dayOfWeek}
          className={`flex items-center gap-3 px-4 py-2 border-t border-gray-100 ${entry.closed ? "bg-gray-50/60" : ""}`}
        >
          <span className="w-24 shrink-0 text-sm font-medium text-gray-700">{DAY_LABELS[entry.dayOfWeek]}</span>
          <div className="w-10 shrink-0">
            <Switch
              checked={!entry.closed}
              onCheckedChange={(checked) => update(entry.dayOfWeek, "closed", !checked)}
              disabled={disabled}
            />
          </div>
          <div className="flex-1">
            <Select disabled={disabled || entry.closed} value={entry.openTime} onValueChange={(v) => update(entry.dayOfWeek, "openTime", v)}>
              <SelectTrigger className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}><SelectValue /></SelectTrigger>
              <SelectContent>{businessTimes.map((t: BusinessTimeType, i: number) => (<SelectItem key={i} value={t.name}>{t.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select disabled={disabled || entry.closed} value={entry.closeTime} onValueChange={(v) => update(entry.dayOfWeek, "closeTime", v)}>
              <SelectTrigger className={`h-9 text-sm ${entry.closed ? "opacity-40" : ""}`}><SelectValue /></SelectTrigger>
              <SelectContent>{businessTimes.map((t: BusinessTimeType, i: number) => (<SelectItem key={i} value={t.name}>{t.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step definitions ──────────────────────────────────────────────

interface SignUpStepItemType {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const signUpSteps: SignUpStepItemType[] = [
  { id: "step1", title: "Account", icon: <User className="w-4 h-4" /> },
  { id: "step2", title: "Verify", icon: <Mail className="w-4 h-4" /> },
  { id: "step3", title: "Business", icon: <Building2 className="w-4 h-4" /> },
];

// ── Main component ────────────────────────────────────────────────

function RegisterForm({ step }: { step: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [currentStep, setCurrentStep] = useState<SignUpStepItemType>(
    () => signUpSteps.find((s) => s.id === step) || signUpSteps[0],
  );
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3 state
  const [businessImageUrl, setBusinessImageUrl] = useState("");
  const [multipleLocations, setMultipleLocations] = useState(false);
  const [singleLocationHours, setSingleLocationHours] = useState<OperatingHoursEntry[]>(getDefaultOperatingHours);
  const [locations, setLocations] = useState<LocationFormEntry[]>([createEmptyLocation()]);

  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();
  const subscription = searchParams.get("package");
  const referredByCode = searchParams.get("referredByCode");
  const { toast } = useToast();

  useEffect(() => {
    if (subscription) {
      localStorage.removeItem("subscription");
      localStorage.setItem("subscription", subscription);
    }
  }, [subscription]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Form instances ──────────────────────────────────────────────

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phoneNumber: "",
      password: "", confirmPassword: "",
      countryId: defaultCountry ?? "",
      referredByCode: referredByCode ?? "",
    },
  });

  const businessForm = useForm<z.infer<typeof BusinessSetupSchema>>({
    resolver: zodResolver(BusinessSetupSchema),
    defaultValues: {
      name: "", email: session?.data?.user.email ?? "",
      phone: session?.data?.user.phoneNumber ?? "",
      description: "", city: "", address: "",
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────

  const stepIndex = signUpSteps.findIndex((s) => s.id === currentStep.id);

  const advanceStep = useCallback(() => {
    const idx = signUpSteps.findIndex((s) => s.id === currentStep.id);
    if (idx < signUpSteps.length - 1) setCurrentStep(signUpSteps[idx + 1]);
  }, [currentStep.id]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.log("Form errors:", errors);
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: "Please check the form for errors and try again.",
    });
  }, [toast]);

  const addLocation = useCallback(() => {
    setLocations((prev) => [...prev, createEmptyLocation()]);
  }, []);

  const removeLocation = useCallback((id: string) => {
    setLocations((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  }, []);

  const updateLocation = useCallback(
    (id: string, field: keyof LocationFormEntry, value: any) => {
      setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
    }, [],
  );

  // ── Submission handlers ─────────────────────────────────────────

  const submitData = async (values: z.infer<typeof RegisterSchema>) => {
    setError(""); setSuccess("");
    startTransition(async () => {
      try {
        const data = await register(values);
        if (data.responseType === "error") { setError(data.message); return; }
        if (data.responseType === "success") advanceStep();
      } catch (err: any) {
        setError(err?.message || "An unexpected error occurred.");
      }
    });
  };

  const submitVerificationCode = useCallback(async () => {
    if (verificationCode.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setError(""); setSuccess("");
    startTransition(async () => {
      try {
        const data = await verifyEmailCode(verificationCode);
        if (data.responseType === "error") { setError(data.message); return; }
        if (data.responseType === "success") {
          setSuccess(data.message);
          if (data.data && (data.data as any).requiresLogin) { router.push("/login"); return; }
          advanceStep();
        }
      } catch (err: any) {
        setError(err?.message || "Verification failed.");
      }
    });
  }, [verificationCode, advanceStep, router]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError("");
    startTransition(async () => {
      try {
        const resp = await resendVerificationCode();
        if (resp.responseType === "error") { setError(resp.message); }
        else { setSuccess("Verification code sent!"); setResendCooldown(60); }
      } catch { setError("Failed to resend code."); }
    });
  }, [resendCooldown]);

  const submitBusinessData = useCallback(
    async (values: z.infer<typeof BusinessSetupSchema>) => {
      setError(""); setSuccess("");

      // Build locations array
      let locationsList: LocationInput[];

      if (multipleLocations) {
        // Validate that locations have names
        const invalid = locations.find((l) => !l.name.trim());
        if (invalid) { setError("Each location must have a name."); return; }
        // Validate operating hours — at least one day must be open per location
        const allClosed = locations.find((l) => l.operatingHours.every((h) => h.closed));
        if (allClosed) { setError(`"${allClosed.name || "A location"}" must be open at least one day of the week.`); return; }
        locationsList = locations.map((l) => ({
          name: l.name,
          region: l.city || undefined,
          address: l.address || undefined,
          operatingHours: l.operatingHours,
        }));
      } else {
        // Validate operating hours — at least one day must be open
        if (singleLocationHours.every((h) => h.closed)) {
          setError("Your business must be open at least one day of the week.");
          return;
        }
        // Single location: use business name as location name
        locationsList = [{
          name: values.name,
          region: values.city || undefined,
          address: values.address || undefined,
          operatingHours: singleLocationHours,
        }];
      }

      startTransition(async () => {
        try {
          const response = await createBusinessWithLocations({
            businessName: values.name,
            description: values.description || undefined,
            phoneNumber: values.phone,
            email: values.email,
            businessTypeId: values.businessType,
            countryId: values.country,
            logoUrl: businessImageUrl || undefined,
            locations: locationsList,
          });
          if (!response) { setError("Something went wrong."); return; }
          if (response.responseType === "error") { setError(response.message); }
          else if (response.responseType === "success") { router.push("/dashboard"); }
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
        }
      });
    },
    [businessImageUrl, multipleLocations, locations, singleLocationHours, router],
  );

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Step indicator */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between">
          {signUpSteps.map((item, index) => {
            const isCurrent = currentStep.id === item.id;
            const isDone = index < stepIndex;
            return (
              <React.Fragment key={item.id}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${isDone ? "bg-primary text-white" : isCurrent ? "bg-primary/10 text-primary border-2 border-primary" : "bg-gray-100 text-gray-400"}`}>
                    {isDone ? <CheckIcon size={16} /> : item.icon}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline transition-colors ${isCurrent ? "text-gray-900" : isDone ? "text-primary" : "text-gray-400"}`}>
                    {item.title}
                  </span>
                </div>
                {index < signUpSteps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 transition-colors duration-300 ${index < stepIndex ? "bg-primary" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl"
        >
          {/* ═══════ STEP 1: Account ═══════ */}
          {currentStep.id === "step1" && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
                <CardDescription className="text-gray-500">Get started in under 2 minutes</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-6 space-y-5">
                {error && <FormError message={error} />}
                {success && <FormSuccess message={success} />}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(submitData)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm text-gray-700">First name</FormLabel><FormControl><Input disabled={isPending} placeholder="John" className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm text-gray-700">Last name</FormLabel><FormControl><Input disabled={isPending} placeholder="Doe" className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel className="text-sm text-gray-700">Email address</FormLabel><FormControl><Input placeholder="you@example.com" type="email" disabled={isPending} className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm text-gray-700">Phone number</FormLabel><FormControl><PhoneInput placeholder="Enter phone number" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="countryId" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm text-gray-700">Country</FormLabel><FormControl><CountrySelector {...field} isDisabled={isPending} placeholder="Select country" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-gray-700">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input disabled={isPending} type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" className="h-11 pr-11" {...field} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm text-gray-700">Confirm password</FormLabel><FormControl><Input disabled={isPending} type={showPassword ? "text" : "password"} placeholder="Re-enter password" className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="referredByCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700">Referral code <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                        <FormControl><Input {...field} disabled={isPending} value={field.value || ""} placeholder="Enter referral code" className="h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" disabled={isPending} className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20">
                      {isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Create Account<ArrowRight className="w-4 h-4" /></span>}
                    </Button>
                  </form>
                </Form>
                <div className="relative pt-1"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-medium">or</span></div></div>
                <SocialAuthButtons mode="register" onError={(msg) => setError(msg)} disabled={isPending} />
                <p className="text-center text-sm text-gray-500">Already have an account?{" "}<Link href="/login" className="font-semibold text-primary hover:text-orange-700 transition-colors">Sign in</Link></p>
              </CardContent>
            </Card>
          )}

          {/* ═══════ STEP 2: Email Verification ═══════ */}
          {(currentStep.id === "step2" || step === "step2") && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2 pt-8 px-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4"><KeyRound className="w-7 h-7 text-primary" /></div>
                <CardTitle className="text-2xl font-bold text-gray-900">Check your email</CardTitle>
                <CardDescription className="text-gray-500 mt-1">We sent a 6-digit verification code to your inbox</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-6">
                {error && <FormError message={error} />}
                {success && <FormSuccess message={success} />}
                <div className="flex flex-col items-center space-y-6 pt-2">
                  <InputOTP maxLength={6} value={verificationCode} onChange={(value) => setVerificationCode(value)} disabled={isPending}>
                    <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                  </InputOTP>
                  <Button onClick={submitVerificationCode} disabled={isPending || verificationCode.length !== 6} className="w-full h-11 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md shadow-primary/20">
                    {isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-2">Verify & Continue<ArrowRight className="w-4 h-4" /></span>}
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500">
                  Didn&#39;t receive the code?{" "}
                  {resendCooldown > 0 ? <span className="text-gray-400">Resend in {resendCooldown}s</span> : (
                    <button type="button" onClick={handleResendCode} disabled={isPending} className="font-semibold text-primary hover:text-orange-700 transition-colors disabled:opacity-50">Resend code</button>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ═══════ STEP 3: Business Setup ═══════ */}
          {(currentStep.id === "step3" || step === "step3") && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2 pt-8 px-8">
                <CardTitle className="text-2xl font-bold text-gray-900">Set up your business</CardTitle>
                <CardDescription className="text-gray-500">Almost done! Tell us about your business so we can get you started.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {error && <FormError message={error} />}
                {success && <FormSuccess message={success} />}

                <Form {...businessForm}>
                  <form className="space-y-6 mt-4" onSubmit={businessForm.handleSubmit(submitBusinessData, onInvalid)}>

                    {/* ── Business info ─────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="shrink-0">
                        <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
                          <UploadImageWidget imagePath="business" displayStyle="default" displayImage setImage={setBusinessImageUrl} label="Logo" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={businessForm.control} name="name" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-gray-700">Business name</FormLabel>
                              <FormControl><Input placeholder={`e.g. ${session?.data?.user?.firstName || "Your"}'s Business`} {...field} disabled={isPending} className="h-11" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={businessForm.control} name="businessType" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-gray-700">Business type</FormLabel>
                              <FormControl><BusinessTypeSelector value={field.value} onChange={field.onChange} onBlur={field.onBlur} isRequired isDisabled={isPending} label="Business Type" placeholder="Select type" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={businessForm.control} name="phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-gray-700">Phone</FormLabel>
                              <FormControl><PhoneInput placeholder="Phone number" {...field} disabled={isPending} value={field.value || ""} onChange={(v) => field.onChange(v)} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={businessForm.control} name="email" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-gray-700">Email</FormLabel>
                              <FormControl><Input {...field} disabled={isPending} type="email" value={field.value || ""} placeholder="info@yourbusiness.com" className="h-11" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </div>

                    <FormField control={businessForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-700">Description <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                        <FormControl><Textarea placeholder="Briefly describe what your business does..." {...field} disabled={isPending} className="min-h-[100px] resize-none" maxLength={200} value={field.value || ""} /></FormControl>
                        <FormDescription className="text-xs text-gray-400">{field.value?.length || 0}/200</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* ── Location mode toggle ─────────── */}
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Multiple locations?</p>
                        <p className="text-xs text-gray-400">Toggle on if your business has more than one branch</p>
                      </div>
                      <Switch
                        checked={multipleLocations}
                        onCheckedChange={setMultipleLocations}
                        disabled={isPending}
                      />
                    </div>

                    {/* ── Single location (default) ────── */}
                    {!multipleLocations && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField control={businessForm.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm text-gray-700">Country</FormLabel><FormControl><CountrySelector {...field} isDisabled={isPending} placeholder="Select country" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={businessForm.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel className="text-sm text-gray-700">City / Region</FormLabel><FormControl><Input {...field} disabled={isPending} placeholder="e.g. Dar es Salaam" className="h-11" value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={businessForm.control} name="address" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm text-gray-700">Street address</FormLabel><FormControl><Input {...field} disabled={isPending} placeholder="e.g. 123 Uhuru Street" className="h-11" value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                        )} />

                        <div className="pt-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Operating Hours</span>
                          </div>
                          <OperatingHoursTable hours={singleLocationHours} onChange={setSingleLocationHours} disabled={isPending} />
                        </div>
                      </motion.div>
                    )}

                    {/* ── Multiple locations ────────────── */}
                    {multipleLocations && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Locations</span>
                          <span className="ml-auto text-xs text-gray-400">{locations.length} location{locations.length !== 1 ? "s" : ""}</span>
                        </div>

                        {locations.map((loc, idx) => (
                          <div key={loc.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-700">Location {idx + 1}</span>
                              <div className="flex items-center gap-1">
                                <button type="button" onClick={() => updateLocation(loc.id, "hoursExpanded", !loc.hoursExpanded)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Toggle hours">
                                  {loc.hoursExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {locations.length > 1 && (
                                  <button type="button" onClick={() => removeLocation(loc.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Remove location">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">Location name *</label>
                                  <Input value={loc.name} onChange={(e) => updateLocation(loc.id, "name", e.target.value)} placeholder="e.g. Main Branch" disabled={isPending} className="h-10" />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">City / Region</label>
                                  <Input value={loc.city} onChange={(e) => updateLocation(loc.id, "city", e.target.value)} placeholder="e.g. Dar es Salaam" disabled={isPending} className="h-10" />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Street address</label>
                                <Input value={loc.address} onChange={(e) => updateLocation(loc.id, "address", e.target.value)} placeholder="e.g. 123 Uhuru Street" disabled={isPending} className="h-10" />
                              </div>
                              {loc.hoursExpanded && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1">
                                  <OperatingHoursTable
                                    hours={loc.operatingHours}
                                    onChange={(h) => updateLocation(loc.id, "operatingHours", h)}
                                    disabled={isPending}
                                  />
                                </motion.div>
                              )}
                              {!loc.hoursExpanded && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock size={12} /> Monday-Saturday 8:00 AM - 9:00 PM, Sunday Closed
                                  <button type="button" onClick={() => updateLocation(loc.id, "hoursExpanded", true)} className="ml-1 text-primary hover:underline">Edit</button>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addLocation}
                          disabled={isPending}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                        >
                          <Plus size={16} /> Add another location
                        </button>
                      </motion.div>
                    )}

                    {/* ── Submit ────────────────────────── */}
                    <Button type="submit" disabled={isPending} className="w-full h-12 bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md shadow-primary/20">
                      {isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : (
                        <span className="flex items-center gap-2">Complete Setup<CheckIcon className="w-4 h-4" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3" /> Secured with end-to-end encryption
      </p>
    </div>
  );
}

export default RegisterForm;
