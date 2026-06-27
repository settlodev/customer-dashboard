"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
// import { exportExpenseReport } from "@/lib/actions/accounting-reports-actions";

interface Props {
  from: string;
  to: string;
}

export function ExpenseReportExportButton({ from, to }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // try {
    //   const blob = await exportExpenseReport(from, to);
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = `expense-report_${from}_${to}.csv`;
    //   a.click();
    //   URL.revokeObjectURL(url);
    // } finally {
    //   setIsExporting(false);
    // }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-2 h-3.5 w-3.5" />
      {isExporting ? "Exporting…" : "Export"}
    </Button>
  );
}
