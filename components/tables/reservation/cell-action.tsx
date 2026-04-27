"use client";

import { Edit, MoreHorizontal, Trash, CheckCircle, UserCheck, XCircle, AlertTriangle, Armchair } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDisclosure } from "@/hooks/use-disclosure";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteModal from "@/components/tables/delete-modal";
import { useToast } from "@/hooks/use-toast"
import { Reservation, RESERVATION_STATUS_LABELS, VALID_STATUS_TRANSITIONS } from "@/types/reservation/type";
import { ReservationStatus } from "@/types/enums";
import { deleteReservation, updateReservationStatus } from "@/lib/actions/reservation-actions";

const STATUS_ACTION_CONFIG: Record<ReservationStatus, { icon: React.ElementType; className: string }> = {
  [ReservationStatus.CONFIRMED]: { icon: CheckCircle, className: "text-blue-600" },
  [ReservationStatus.SEATED]: { icon: Armchair, className: "text-emerald-600" },
  [ReservationStatus.COMPLETED]: { icon: UserCheck, className: "text-gray-600" },
  [ReservationStatus.CANCELLED]: { icon: XCircle, className: "text-red-600" },
  [ReservationStatus.NO_SHOW]: { icon: AlertTriangle, className: "text-orange-600" },
  [ReservationStatus.PENDING]: { icon: CheckCircle, className: "text-yellow-600" },
};

interface CellActionProps {
  data: Reservation;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const currentStatus = data.reservationStatus as ReservationStatus;
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  const onStatusChange = async (newStatus: ReservationStatus) => {
    setUpdating(true);
    try {
      const result = await updateReservationStatus(data.id, newStatus);
      if (result && result.responseType === "success") {
        toast({
          variant: "success",
          title: "Status Updated",
          description: `Reservation marked as ${RESERVATION_STATUS_LABELS[newStatus]}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result?.message || "Failed to update status",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to update status",
      });
    } finally {
      setUpdating(false);
    }
  };

  const onDelete = async () => {
    try {
      if (data) {
        await deleteReservation(data.id);
        toast({
          variant: "success",
          title: "Success",
          description: "Reservation deleted successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description:
            "There was an issue with your request, please try again later",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description:
        (error as Error).message ||
          "There was an issue with your request, please try again later",
      });
    } finally {
      onOpenChange();
    }
  };

  return (
    <>
      <div className="relative flex items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost" disabled={updating}>
              <span className="sr-only">Actions</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push(`/reservations/${data.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" /> Update
            </DropdownMenuItem>
            {data.canDelete && (
              <DropdownMenuItem onClick={onOpen}>
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
            {validTransitions.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                {validTransitions.map((status) => {
                  const config = STATUS_ACTION_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onStatusChange(status)}
                      className={config.className}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {RESERVATION_STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {data.canDelete && (
        <DeleteModal
          isOpen={isOpen}
          itemName={data.customerName || "this reservation"}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
