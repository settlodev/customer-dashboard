"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package2,
  PackageX,
  PackageMinus,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StockHistory } from "@/types/stock/type";
import { stockHistory } from "@/lib/actions/stock-actions";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Loading from "@/components/ui/loading";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { Location } from "@/types/location/type";

const ITEMS_PER_PAGE = 5;
const VISIBLE_PAGES = 5;
const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";

// ── Hidden PDF template ─────────────────────────────────────────────
const StockReportTemplate = ({
  id,
  type,
  items,
  location,
}: {
  id: string;
  type: "low" | "out";
  items: {
    stockName: string;
    stockVariantName: string;
    remainingAmount?: number;
  }[];
  location: Location | null;
}) => {
  const isLow = type === "low";
  const title = isLow ? "Low Stock Items Report" : "Out of Stock Items Report";
  const accentColor = isLow ? PRIMARY : "#DC2626";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      id={id}
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "794px",
        backgroundColor: "#ffffff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111827",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "40px 40px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Left — logo */}
        <div>
          {location?.image ? (
            <img
              src={location.image}
              alt={location.name}
              style={{ height: "60px", width: "auto", objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          ) : (
            <div
              style={{
                height: "48px",
                width: "48px",
                borderRadius: "6px",
                backgroundColor: PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "20px",
              }}
            >
              {location?.name?.[0] ?? "S"}
            </div>
          )}
        </div>

        {/* Right — report title + business info */}
        <div style={{ textAlign: "right" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "34px",
              fontWeight: 300,
              letterSpacing: "0.08em",
              color: PRIMARY_DARK,
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            STOCK REPORT
          </h2>
          <div style={{ marginTop: "10px", lineHeight: 1.7 }}>
            {/* Use businessName ("Pesa Wakala") not name ("Testing") */}
            {(location?.businessName ?? location?.name) && (
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#111827",
                }}
              >
                {location?.businessName ?? location?.name}
              </p>
            )}
            {location?.address && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                {location.address}
              </p>
            )}
            {location?.street && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                {location.street}
              </p>
            )}
            {location?.city && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                {location.city}
              </p>
            )}
            {location?.phone && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                Mobile: {location.phone}
              </p>
            )}
            {location?.email && (
              <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
                {location.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div
        style={{ height: "1px", backgroundColor: "#E5E7EB", margin: "0 40px" }}
      />

      {/* ── REPORT META ── */}
      <div
        style={{
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#9CA3AF",
            }}
          >
            Report Type
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "16px",
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {title}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
            Generated:{" "}
            <span style={{ fontWeight: 600, color: "#374151" }}>{today}</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
            Total items:{" "}
            <span style={{ fontWeight: 600, color: "#374151" }}>
              {items.length}
            </span>
          </p>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#E5E7EB",
          margin: "0 40px 24px",
        }}
      />

      {/* ── TABLE ── */}
      <div style={{ padding: "0 40px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  backgroundColor: accentColor,
                  color: "#ffffff",
                  padding: "11px 14px",
                  fontWeight: 700,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textAlign: "left",
                  width: "48px",
                }}
              >
                #
              </th>
              <th
                style={{
                  backgroundColor: accentColor,
                  color: "#ffffff",
                  padding: "11px 14px",
                  fontWeight: 700,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textAlign: "left",
                }}
              >
                Stock Item
              </th>
              {isLow && (
                <th
                  style={{
                    backgroundColor: accentColor,
                    color: "#ffffff",
                    padding: "11px 14px",
                    fontWeight: 700,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    textAlign: "right",
                    width: "120px",
                  }}
                >
                  Quantity
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#F9F9F7",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    color: "#9CA3AF",
                    fontWeight: 500,
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ padding: "10px 14px", color: "#111827" }}>
                  <span style={{ fontWeight: 600 }}>{item.stockName}</span>
                  <span style={{ color: "#6B7280" }}>
                    {" "}
                    — {item.stockVariantName}
                  </span>
                </td>
                {isLow && (
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {Intl.NumberFormat().format(item.remainingAmount ?? 0)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: "32px 40px 36px",
          marginTop: "32px",
          borderTop: "1px solid #E5E7EB",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 2px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Thank you for your business and continued support
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#9CA3AF" }}>
          Powered by Settlo Technologies
        </p>
      </div>
    </div>
  );
};

// ── PDF capture helper ───────────────────────────────────────────────
async function captureAndDownload(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Save original styles
  const prev = {
    position: el.style.position,
    top: el.style.top,
    left: el.style.left,
    visibility: el.style.visibility,
    pointerEvents: el.style.pointerEvents,
  };

  // Keep off-screen — no visible flash
  Object.assign(el.style, {
    position: "fixed",
    top: "-9999px",
    left: "-9999px",
    visibility: "visible",
    pointerEvents: "none",
  });

  await new Promise((r) => setTimeout(r, 150));
  await Promise.all(
    Array.from(el.querySelectorAll("img")).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((r) => {
        img.onload = r;
        img.onerror = r;
        setTimeout(r, 5000);
      });
    }),
  );

  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#ffffff",
    width: 794,
    height: el.scrollHeight,
    windowWidth: 1200,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 15000,
    removeContainer: true,
  });

  Object.assign(el.style, prev);

  const A4_W = 210,
    A4_H = 297,
    MARGIN = 10;
  const printW = A4_W - MARGIN * 2;
  const contentH = (canvas.height * printW) / canvas.width;
  const pageH = A4_H - MARGIN * 2;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  if (contentH <= pageH) {
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      MARGIN,
      MARGIN,
      printW,
      contentH,
    );
  } else {
    const totalPages = Math.ceil(contentH / pageH);
    const pageHeightPx = (pageH * canvas.width) / printW;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const srcY = page * pageHeightPx;
      const srcH = Math.min(pageHeightPx, canvas.height - srcY);

      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = srcH;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        srcH,
        0,
        0,
        canvas.width,
        srcH,
      );

      pdf.addImage(
        slice.toDataURL("image/jpeg", 1.0),
        "JPEG",
        MARGIN,
        MARGIN,
        printW,
        (srcH * printW) / canvas.width,
      );
    }
  }

  pdf.save(filename);
}

// ── Main dashboard ───────────────────────────────────────────────────
const StockHistoryDashboard = () => {
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<Location | null>(null);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [outOfStockPage, setOutOfStockPage] = useState(1);
  const [downloadingLow, setDownloadingLow] = useState(false);
  const [downloadingOut, setDownloadingOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [response, loc] = await Promise.all([
          stockHistory(),
          getCurrentLocation(),
        ]);
        setHistory(response);
        setLocation(loc ?? null);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadLowStock = async () => {
    setDownloadingLow(true);
    try {
      await captureAndDownload("stock-report-low", "low-stock-report.pdf");
    } finally {
      setDownloadingLow(false);
    }
  };

  const handleDownloadOutOfStock = async () => {
    setDownloadingOut(true);
    try {
      await captureAndDownload("stock-report-out", "out-of-stock-report.pdf");
    } finally {
      setDownloadingOut(false);
    }
  };

  // ── Pagination helpers (unchanged) ──
  const getPageRange = (currentPage: number, totalPages: number) => {
    let start = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2));
    const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
    if (end === totalPages) start = Math.max(1, end - VISIBLE_PAGES + 1);
    const pages: (number | string)[] = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getLowStockItems = () => {
    if (!history?.lowStockItems) return [];
    return history.lowStockItems.slice(
      (lowStockPage - 1) * ITEMS_PER_PAGE,
      lowStockPage * ITEMS_PER_PAGE,
    );
  };

  const getOutOfStockItems = () => {
    if (!history?.outOfStockItems) return [];
    return history.outOfStockItems.slice(
      (outOfStockPage - 1) * ITEMS_PER_PAGE,
      outOfStockPage * ITEMS_PER_PAGE,
    );
  };

  const getLowStockPageCount = () =>
    Math.ceil((history?.lowStockItems?.length || 0) / ITEMS_PER_PAGE);
  const getOutOfStockPageCount = () =>
    Math.ceil((history?.outOfStockItems?.length || 0) / ITEMS_PER_PAGE);

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    onPrev: () => void,
    onNext: () => void,
  ) => {
    if (totalPages <= 1) return null;
    const pages = getPageRange(currentPage, totalPages);
    return (
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={onPrev}
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50",
                )}
              />
            </PaginationItem>
            {pages.map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <span className="px-4 py-2">...</span>
                ) : (
                  <PaginationLink
                    onClick={() => onPageChange(page as number)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={onNext}
                className={cn(
                  currentPage === totalPages &&
                    "pointer-events-none opacity-50",
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 space-y-6 min-h-screen">
      {/* Hidden PDF templates — rendered off-screen, captured by html2canvas */}
      {history !== null && (history.lowStockItems?.length ?? 0) > 0 && (
        <StockReportTemplate
          id="stock-report-low"
          type="low"
          items={history.lowStockItems}
          location={location}
        />
      )}
      {history !== null && (history.outOfStockItems?.length ?? 0) > 0 && (
        <StockReportTemplate
          id="stock-report-out"
          type="out"
          items={history.outOfStockItems}
          location={location}
        />
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Stock report summary
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of your current stock levels and inventory status
        </p>
      </div>

      {/* Summary cards — unchanged */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total available stock
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Package2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockRemaining || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total stock value
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockValue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated profit
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalEstimatedProfit || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total stock intakes
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Intl.NumberFormat().format(history?.totalStockIntakes || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low stock items
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PackageMinus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Intl.NumberFormat().format(history?.lowStockItems.length || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of stock items
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PackageX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Intl.NumberFormat().format(history?.outOfStockItems.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail tables */}
      {(history?.lowStockItems?.length ?? 0) +
        (history?.outOfStockItems?.length ?? 0) >
        0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(history?.lowStockItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageMinus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Low stock items
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLowStock}
                    disabled={downloadingLow}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingLow ? "Generating…" : "Download PDF"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Stock item</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getLowStockItems().map((item, index) => (
                      <TableRow
                        key={`${item.stockName}-${item.stockVariantName}-${index}`}
                      >
                        <TableCell className="text-muted-foreground">
                          {(lowStockPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.stockName} - {item.stockVariantName}
                        </TableCell>
                        <TableCell className="font-medium text-amber-600 dark:text-amber-400">
                          {Intl.NumberFormat().format(item.remainingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {renderPagination(
                  lowStockPage,
                  getLowStockPageCount(),
                  (page) => setLowStockPage(page),
                  () => {
                    if (lowStockPage > 1) setLowStockPage((p) => p - 1);
                  },
                  () => {
                    if (lowStockPage < getLowStockPageCount())
                      setLowStockPage((p) => p + 1);
                  },
                )}
              </CardContent>
            </Card>
          )}

          {(history?.outOfStockItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Out of stock items
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadOutOfStock}
                    disabled={downloadingOut}
                    className="gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloadingOut ? "Generating…" : "Download PDF"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Stock item</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getOutOfStockItems().map((item, index) => (
                      <TableRow
                        key={`${item.stockName}-${item.stockVariantName}-${index}`}
                      >
                        <TableCell className="text-muted-foreground">
                          {(outOfStockPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-red-600 dark:text-red-400">
                          {item.stockName} - {item.stockVariantName}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {renderPagination(
                  outOfStockPage,
                  getOutOfStockPageCount(),
                  (page) => setOutOfStockPage(page),
                  () => {
                    if (outOfStockPage > 1) setOutOfStockPage((p) => p - 1);
                  },
                  () => {
                    if (outOfStockPage < getOutOfStockPageCount())
                      setOutOfStockPage((p) => p + 1);
                  },
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StockHistoryDashboard;
