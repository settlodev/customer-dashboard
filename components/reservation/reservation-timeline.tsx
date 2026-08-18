"use client";

import { useEffect, useState } from "react";
import { UUID } from "node:crypto";
import { formatDistanceToNow, format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Edit3,
  Link2,
  Loader2,
  MailQuestion,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchReservationEvents } from "@/lib/actions/reservation-actions";
import { ReservationEvent } from "@/types/reservation/type";

/**
 * Visual config for each event type — drives the icon, color, and friendly
 * label. Anything not in this map falls back to a neutral default so the
 * UI tolerates new event types added on the OMS side without breaking.
 */
const EVENT_VISUALS: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  RESERVATION_CREATED: {
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: "Created",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  RESERVATION_UPDATED: {
    icon: <Edit3 className="h-3.5 w-3.5" />,
    label: "Updated",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  RESERVATION_DELETED: {
    icon: <Trash2 className="h-3.5 w-3.5" />,
    label: "Deleted",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  STATUS_PENDING: {
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  STATUS_CONFIRMED: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  STATUS_SEATED: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    label: "Seated",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  STATUS_COMPLETED: {
    icon: <ChefHat className="h-3.5 w-3.5" />,
    label: "Completed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  STATUS_CANCELLED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  STATUS_NO_SHOW: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "No-show",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  DEPOSIT_PAYMENT_INITIATED: {
    icon: <CircleDollarSign className="h-3.5 w-3.5" />,
    label: "Deposit requested",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  DEPOSIT_MANUAL_CONFIRMATION_INITIATED: {
    icon: <CircleDollarSign className="h-3.5 w-3.5" />,
    label: "Manual deposit",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  DEPOSIT_PAID: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Deposit paid",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  DEPOSIT_FAILED: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Deposit failed",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  DEPOSIT_REFUNDED: {
    icon: <RotateCcw className="h-3.5 w-3.5" />,
    label: "Deposit refunded",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  REMINDER_SENT: {
    icon: <Send className="h-3.5 w-3.5" />,
    label: "Reminder sent",
    color: "bg-sky-100 text-sky-700 border-sky-200",
  },
  ORDER_LINKED: {
    icon: <Link2 className="h-3.5 w-3.5" />,
    label: "Order linked",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  CUSTOMER_LINKED: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    label: "Customer linked",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

const FALLBACK_VISUAL = {
  icon: <MessageCircle className="h-3.5 w-3.5" />,
  label: "Event",
  color: "bg-gray-100 text-gray-700 border-gray-200",
};

function visualFor(eventType: string) {
  return EVENT_VISUALS[eventType] ?? {
    ...FALLBACK_VISUAL,
    label: eventType.replace(/_/g, " ").toLowerCase(),
  };
}

function MetadataView({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return null;
  return (
    <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium text-muted-foreground">{k}</dt>
          <dd className="text-foreground break-all">
            {typeof v === "string" ? v : JSON.stringify(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TimelineRow({ event }: { event: ReservationEvent }) {
  const [expanded, setExpanded] = useState(false);
  const visual = visualFor(event.eventType);
  const hasMetadata = !!event.metadata && Object.keys(event.metadata).length > 0;
  const occurredAt = new Date(event.occurredAt || event.createdAt);
  const relative = formatDistanceToNow(occurredAt, { addSuffix: true });
  const absolute = format(occurredAt, "PPp");

  return (
    <li className="relative pl-10 pb-6 last:pb-0">
      {/* Vertical track behind the dot */}
      <span className="absolute left-3 top-2 bottom-0 w-px bg-border last:hidden" />
      {/* Event dot */}
      <span
        className={`absolute left-0 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border ${visual.color}`}
      >
        {visual.icon}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`${visual.color} font-normal`}>
          {visual.label}
        </Badge>
        <span className="text-xs text-muted-foreground" title={absolute}>
          {relative}
        </span>
      </div>

      {event.description && (
        <p className="mt-1 text-sm text-foreground">{event.description}</p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {event.actorId ? (
          <span className="inline-flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            {event.actorType
              ? `${event.actorType.toLowerCase()} · ${event.actorId.slice(0, 8)}…`
              : `actor ${event.actorId.slice(0, 8)}…`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 italic">
            <Calendar className="h-3 w-3" />
            system
          </span>
        )}
        <span title={event.createdAt}>{absolute}</span>
      </div>

      {hasMetadata && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 h-6 px-2 text-xs"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          {expanded ? "Hide details" : "Show details"}
        </Button>
      )}
      {expanded && hasMetadata && (
        <MetadataView metadata={event.metadata as Record<string, unknown>} />
      )}
    </li>
  );
}

interface ReservationTimelineProps {
  reservationId: UUID;
}

export default function ReservationTimeline({
  reservationId,
}: ReservationTimelineProps) {
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservationEvents(reservationId);
      setEvents(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load reservation timeline",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            <p className="text-sm text-muted-foreground">
              Every change to this reservation, with the staff who made it.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        </div>

        {loading && events.length === 0 && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading timeline…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <MailQuestion className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Couldn&apos;t load the timeline</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-md border border-dashed border-muted-foreground/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No timeline events yet. Actions on this reservation will appear here.
          </div>
        )}

        {events.length > 0 && (
          <ol className="relative">
            {events.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
