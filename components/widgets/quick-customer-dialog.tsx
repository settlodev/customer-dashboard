"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import GenderSelector from "@/components/widgets/gender-selector";
import { useToast } from "@/hooks/use-toast";
import { createCustomer } from "@/lib/actions/customer-actions";
import { invalidateCustomersCache } from "@/lib/cache/reference-data";
import type { Customer } from "@/types/customer/type";
import type { Gender, CustomerCreatedFrom } from "@/types/enums";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the freshly-created customer so the caller can select it. */
  onCreated: (customer: Customer) => void;
  /** Optional origin tag stamped on the new customer. */
  createdFrom?: CustomerCreatedFrom;
}

/**
 * Compact inline "create customer" dialog — lets a form create a customer
 * without leaving the page (mirrors the reservation quick-add). Captures only
 * the schema-required fields plus email/TIN (handy for invoicing). The caller
 * selects the returned customer.
 */
export default function QuickCustomerDialog({
  open,
  onOpenChange,
  onCreated,
  createdFrom,
}: Props) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on close so a re-open starts clean.
  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setGender("");
      setPhoneNumber("");
      setEmail("");
      setTinNumber("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!gender &&
    !!phoneNumber.trim() &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: gender as Gender,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        tinNumber: tinNumber.trim() || undefined,
        createdFrom,
        allowNotifications: true,
        active: true,
      });
      if (result?.responseType === "success" && result.data) {
        invalidateCustomersCache();
        toast({
          variant: "success",
          title: "Customer created",
          description: `${firstName.trim()} ${lastName.trim()} was added.`,
        });
        onCreated(result.data as Customer);
        onOpenChange(false);
      } else {
        const message = result?.message ?? "Couldn't create customer";
        setError(message);
      }
    } catch (e) {
      setError((e as Error)?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>
            Capture the basics — you can fill in the rest later from the
            Customers page.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
          <div className="min-w-0">
            <Label className="text-xs font-medium">
              First name <span className="text-red-500">*</span>
            </Label>
            <Input
              className="mt-1"
              placeholder="e.g. Amani"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium">
              Last name <span className="text-red-500">*</span>
            </Label>
            <Input
              className="mt-1"
              placeholder="e.g. Mushi"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium">
              Gender <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <GenderSelector
                value={gender}
                onChange={setGender}
                isDisabled={submitting}
                label="Gender"
                placeholder="Select gender"
                onBlur={() => {}}
              />
            </div>
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium">
              Phone number <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <PhoneInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(v) => setPhoneNumber(v ?? "")}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium">Email</Label>
            <Input
              className="mt-1"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="min-w-0">
            <Label className="text-xs font-medium">TIN</Label>
            <Input
              className="mt-1"
              placeholder="Tax identification no."
              value={tinNumber}
              onChange={(e) => setTinNumber(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Create customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
