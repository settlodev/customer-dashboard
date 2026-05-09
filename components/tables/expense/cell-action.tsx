"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Send,
  ShieldCheck,
  ShieldX,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  approveExpense,
  deleteExpense,
  rejectExpense,
  submitExpense,
  voidExpense,
} from "@/lib/actions/expense-actions";
import type { Expense } from "@/types/expense/type";

interface Props {
  data: Expense;
}

export function ExpenseCellAction({ data }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);

  const handle = (
    fn: (id: string) => Promise<{ responseType: string; message: string }>,
  ) =>
    startTransition(async () => {
      const result = await fn(data.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Success" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") router.refresh();
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/expenses/${data.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View detail
          </DropdownMenuItem>
          {(data.status === "DRAFT" || data.status === "REJECTED") && (
            <DropdownMenuItem
              onClick={() => router.push(`/expenses/${data.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {data.status === "DRAFT" && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => handle(submitExpense)}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for approval
            </DropdownMenuItem>
          )}
          {data.status === "PENDING" && (
            <>
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => handle(approveExpense)}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => handle(rejectExpense)}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}
          {(data.status === "APPROVED" || data.status === "PENDING") && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => setConfirmVoid(true)}
              className="text-red-600"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Void
            </DropdownMenuItem>
          )}
          {data.status === "DRAFT" && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => setConfirmDelete(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.expenseNumber} will be soft-deleted. You can't undo from
              here — only support can recover it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => handle(deleteExpense)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmVoid} onOpenChange={setConfirmVoid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.expenseNumber} will be marked VOIDED and reversed in the
              journal. This action is recorded but cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => handle(voidExpense)}
            >
              Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
