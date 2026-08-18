"use client";

import { useState, useTransition } from "react";
import { Loader2, UserX } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";

import { deactivateInternalUser } from "@/lib/actions/admin/internal-users";
import { InternalUserResponse } from "@/types/admin/internal-user";

interface DeactivateInternalUserDialogProps {
  user: InternalUserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeactivated: () => void;
}

export function DeactivateInternalUserDialog({
  user,
  open,
  onOpenChange,
  onDeactivated,
}: DeactivateInternalUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      const result = await deactivateInternalUser(user.id);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: "User deactivated",
        description: `${user.email} can no longer sign in.`,
      });
      onDeactivated();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <UserX className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate this user?</AlertDialogTitle>
          <AlertDialogDescription className="break-all">
            <strong>{user.email}</strong> will lose portal access immediately
            and all of their active sessions will be revoked. You can re-create
            them later, but their role assignments will need to be reapplied.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <FormError message={error} />}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deactivating…
              </span>
            ) : (
              "Deactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
