"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Loading from "@/components/ui/loading";
import {
  Loader2Icon,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  DaySession,
  openDaySession,
  closeDaySession,
  getCurrentDaySession,
  listDaySessions,
} from "@/lib/actions/location-day-sessions-actions";
import { Location } from "@/types/location/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DaySessionsPanel = ({
  location,
}: {
  location: Location | null;
}) => {
  const [currentSession, setCurrentSession] = useState<DaySession | null>(null);
  const [recentSessions, setRecentSessions] = useState<DaySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if (!location?.id) return;
    try {
      setIsLoading(true);
      const [session, history] = await Promise.all([
        getCurrentDaySession(location.id),
        listDaySessions(
          location.id,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          new Date().toISOString().split("T")[0],
        ).catch(() => []),
      ]);
      setCurrentSession(session);
      setRecentSessions(history);
    } catch (error) {
      console.error("Failed to load day sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [location?.id]);

  const handleOpen = () => {
    if (!location?.id) return;
    startTransition(async () => {
      const result = await openDaySession(location.id, notes || undefined);
      if (result.responseType === "success") {
        toast({ title: "Day Opened", description: result.message });
        setCurrentSession(result.data ?? null);
        setNotes("");
        await loadData();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setShowOpenDialog(false);
    });
  };

  const handleClose = () => {
    if (!location?.id) return;
    startTransition(async () => {
      const result = await closeDaySession(location.id, notes || undefined);
      if (result.responseType === "success") {
        toast({ title: "Day Closed", description: result.message });
        setCurrentSession(null);
        setNotes("");
        await loadData();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
      setShowCloseDialog(false);
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Day Sessions</h2>
          <p className="text-muted-foreground mt-1 text-sm">Loading...</p>
        </div>
        <Card><CardContent className="p-6 flex items-center justify-center"><Loading /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Day Sessions</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage daily open and close operations for {location?.name || "this location"}
        </p>
      </div>

      {/* Current Session Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentSession ? (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Sun className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Day is Open</p>
                    <p className="text-sm text-muted-foreground">
                      Opened at {formatDateTime(currentSession.openedAt)}
                    </p>
                    {currentSession.openingNotes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentSession.openingNotes}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Moon className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Day is Closed</p>
                    <p className="text-sm text-muted-foreground">No active session</p>
                  </div>
                </>
              )}
            </div>
            {currentSession ? (
              <Button
                variant="destructive"
                onClick={() => setShowCloseDialog(true)}
                disabled={isPending}
              >
                <Moon className="h-4 w-4 mr-2" />
                Close Day
              </Button>
            ) : (
              <Button onClick={() => setShowOpenDialog(true)} disabled={isPending}>
                <Sun className="h-4 w-4 mr-2" />
                Open Day
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Recent Sessions History */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-medium">Recent Sessions (Last 7 Days)</h3>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent sessions found.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {session.status === "OPEN" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{session.businessDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.triggerType === "MANUAL" ? "Manual" : "Scheduled"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(session.openedAt)}</span>
                    </div>
                    {session.closedAt && (
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(session.closedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Day Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Day Session</DialogTitle>
            <DialogDescription>
              Start a new day session for {location?.name}. This will enable operations for today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Opening for Saturday brunch service"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleOpen} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <Sun className="w-4 h-4 mr-2" />}
              Open Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Day Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Day Session</DialogTitle>
            <DialogDescription>
              Close the current day session. Ensure all registers are closed before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Closing Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., End of day - all registers closed"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClose} disabled={isPending}>
              {isPending ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <Moon className="w-4 h-4 mr-2" />}
              Close Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DaySessionsPanel;
