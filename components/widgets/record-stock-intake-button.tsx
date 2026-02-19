"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockIntakeSelectionDialog } from "@/components/widgets/stock-intake-selection";

export function RecordStockIntakeButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>Record Stock Intake</Button>
      <StockIntakeSelectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
