"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  deactivateSupportAgent,
  reactivateSupportAgent,
} from "@/lib/actions/admin/support-agents";
import { SupportAgentResponse } from "@/types/admin/support-agent";

export function SupportAgentRowActions({
  agent,
}: {
  agent: SupportAgentResponse;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = agent.active
        ? await deactivateSupportAgent(agent.id)
        : await reactivateSupportAgent(agent.id);
      if (result.responseType === "error") {
        toast({
          title: "Action failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for ${agent.fullName}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault();
            handleToggle();
          }}
          className={
            agent.active
              ? "text-amber-700 focus:bg-amber-50 focus:text-amber-800 dark:text-amber-300 dark:focus:bg-amber-500/10"
              : "text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-300 dark:focus:bg-emerald-500/10"
          }
        >
          {agent.active ? "Deactivate" : "Reactivate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
