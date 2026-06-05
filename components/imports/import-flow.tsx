"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileWarning,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import {
  bulkCreateMissingLookups,
  commitImport,
  previewImport,
} from "@/lib/actions/import-actions";
import type {
  CommitResponse,
  Decision,
  ImportType,
  PreviewResponse,
  PreviewRow,
  RowDecision,
  RowStatus,
} from "@/types/imports/type";

interface Props {
  type: ImportType;
  title: string;
  description: string;
  templateColumns: string[];
  templateSample?: string[];
  previewColumns: { key: string; label: string }[];
}

export function ImportFlow({
  type,
  title,
  description,
  templateColumns,
  templateSample,
  previewColumns,
}: Props) {
  const { toast } = useToast();
  const [stage, setStage] = useState<"upload" | "preview" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [decisions, setDecisions] = useState<Map<number, RowDecision>>(
    new Map(),
  );
  const [result, setResult] = useState<CommitResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [commitPending, setCommitPending] = useState<string | null>(null);
  const [creatingLookups, setCreatingLookups] = useState(false);

  const downloadTemplate = useCallback(() => {
    const lines = [templateColumns.join(",")];
    if (templateSample?.length) lines.push(templateSample.join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type.toLowerCase()}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [type, templateColumns, templateSample]);

  const onUpload = async () => {
    if (!file) return;
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await previewImport(type, file);
      if (!res.ok) {
        setPreviewError(res.message);
        toast({
          variant: "destructive",
          title: "Preview failed",
          description: res.message,
        });
        return;
      }
      setPreview(res.data);
      // Seed decisions with the per-row defaults.
      const seeded = new Map<number, RowDecision>();
      for (const r of res.data.rows) {
        seeded.set(r.rowIndex, {
          rowIndex: r.rowIndex,
          action: r.defaultDecision,
          targetId:
            r.defaultDecision === "APPLY_INTAKE" &&
            r.suggestedMatches?.length === 1
              ? r.suggestedMatches[0].id
              : null,
        });
      }
      setDecisions(seeded);
      setStage("preview");
    } finally {
      setPreviewing(false);
    }
  };

  const onCommit = async () => {
    if (!preview) return;
    setCommitting(true);
    setCommitError(null);
    setCommitPending(null);
    try {
      const list = Array.from(decisions.values());
      const res = await commitImport(type, preview.previewId, list);
      if (!res.ok) {
        if (res.pending) {
          // Reached the server but no result came back (gateway timeout /
          // 5xx). The import may have completed — warn instead of inviting a
          // blind, duplicate-creating retry. Stay on this screen so nothing
          // is lost, but don't claim success or failure.
          setCommitPending(res.message);
          toast({
            variant: "warning",
            title: "Import may still be processing",
            description:
              "We didn't get a confirmation from the server. Check whether the records were imported before trying again.",
          });
        } else {
          // Couldn't run the commit at all (expired preview, validation).
          setCommitError(res.message);
          toast({
            variant: "destructive",
            title: "Commit failed",
            description: res.message,
          });
        }
        return;
      }
      const data = res.data;
      setResult(data);
      setStage("result");
      const imported = data.created + data.updated;
      const failed = data.errors?.length ?? 0;
      if (failed === 0) {
        toast({
          variant: "success",
          title: "Import complete",
          description: `${data.created} created, ${data.updated} updated, ${data.skipped} skipped`,
        });
      } else if (imported > 0) {
        toast({
          variant: "warning",
          title: "Imported with some errors",
          description: `${imported} imported · ${failed} row${failed === 1 ? "" : "s"} failed — see the summary below`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Nothing imported",
          description: `All ${failed} row${failed === 1 ? "" : "s"} failed — see the summary below`,
        });
      }
    } finally {
      setCommitting(false);
    }
  };

  const setDecision = (rowIndex: number, patch: Partial<RowDecision>) => {
    setDecisions((prev) => {
      const next = new Map(prev);
      const current = next.get(rowIndex);
      if (!current) return prev;
      next.set(rowIndex, { ...current, ...patch });
      return next;
    });
  };

  const applyPreset = useCallback(
    (preset: "update-existing-create-new" | "skip-existing-create-new") => {
      if (!preview) return;
      let touched = 0;
      setDecisions((prev) => {
        const next = new Map(prev);
        for (const r of preview.rows) {
          const current = next.get(r.rowIndex);
          if (!current) continue;
          if (
            r.status === "INVALID_SCHEMA" ||
            r.status === "MISSING_LOOKUP" ||
            r.status === "DUPLICATE_IN_FILE" ||
            r.status === "UNMATCHED"
          ) {
            continue;
          }
          if (r.status === "EXACT_MATCH") {
            if (preset === "update-existing-create-new") {
              const targetId = r.suggestedMatches?.[0]?.id ?? null;
              if (targetId) {
                next.set(r.rowIndex, {
                  ...current,
                  action: "UPDATE_EXISTING",
                  targetId,
                });
                touched++;
              }
            } else {
              next.set(r.rowIndex, {
                ...current,
                action: "SKIP",
                targetId: null,
              });
              touched++;
            }
          } else if (r.status === "READY") {
            next.set(r.rowIndex, {
              ...current,
              action: "CREATE",
              targetId: null,
            });
            touched++;
          }
        }
        return next;
      });
      toast({
        variant: "success",
        title: "Quick action applied",
        description: `${touched} row${touched === 1 ? "" : "s"} updated. Similar matches were left for you to review.`,
      });
    },
    [preview, toast],
  );

  const applyToGroup = useCallback(
    (rowIndexes: number[], action: Decision) => {
      if (!preview) return;
      const matchById = new Map<number, PreviewRow>();
      for (const r of preview.rows) matchById.set(r.rowIndex, r);
      setDecisions((prev) => {
        const next = new Map(prev);
        for (const idx of rowIndexes) {
          const current = next.get(idx);
          if (!current) continue;
          const row = matchById.get(idx);
          const targetId =
            action === "UPDATE_EXISTING" || action === "APPLY_INTAKE"
              ? (row?.suggestedMatches?.[0]?.id ?? null)
              : null;
          next.set(idx, { ...current, action, targetId });
        }
        return next;
      });
    },
    [preview],
  );

  const importableCount = useMemo(() => {
    let n = 0;
    for (const d of decisions.values()) {
      if (d.action !== "SKIP") n++;
    }
    return n;
  }, [decisions]);

  const missingLookups = useMemo(
    () =>
      preview
        ? collectMissingLookups(preview.rows, type)
        : { categories: [], brands: [] },
    [preview, type],
  );

  const onCreateMissingLookups = async () => {
    if (!file) return;
    if (!missingLookups.categories.length && !missingLookups.brands.length) {
      return;
    }
    setCreatingLookups(true);
    try {
      const res = await bulkCreateMissingLookups({
        categories: missingLookups.categories,
        brands: missingLookups.brands,
      });
      if (res.createdCategories || res.createdBrands) {
        toast({
          variant: "success",
          title: "Created",
          description: [
            res.createdCategories
              ? `${res.createdCategories} categor${res.createdCategories === 1 ? "y" : "ies"}`
              : null,
            res.createdBrands
              ? `${res.createdBrands} brand${res.createdBrands === 1 ? "" : "s"}`
              : null,
          ]
            .filter(Boolean)
            .join(", "),
        });
      }
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Some lookups couldn't be created",
          description: res.errors.join("; "),
        });
      }
      await onUpload();
    } finally {
      setCreatingLookups(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={title}
        subtitle={description}
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1.5" />
            Download CSV template
          </Button>
        }
      />
      <PageBody>
        {stage === "upload" && (
          <UploadStep
            file={file}
            setFile={(f) => {
              setFile(f);
              setPreviewError(null);
            }}
            previewing={previewing}
            onUpload={onUpload}
            error={previewError}
            templateColumns={templateColumns}
          />
        )}

        {stage === "preview" && preview && (
          <PreviewStep
            preview={preview}
            decisions={decisions}
            setDecision={setDecision}
            applyPreset={applyPreset}
            applyToGroup={applyToGroup}
            previewColumns={previewColumns}
            importableCount={importableCount}
            committing={committing}
            onCommit={onCommit}
            onReset={() => {
              setStage("upload");
              setFile(null);
              setPreview(null);
              setDecisions(new Map());
              setCommitError(null);
              setCommitPending(null);
            }}
            type={type}
            error={commitError}
            pending={commitPending}
            missingLookups={missingLookups}
            creatingLookups={creatingLookups}
            onCreateMissingLookups={onCreateMissingLookups}
          />
        )}

        {stage === "result" && result && (
          <ResultStep
            result={result}
            onReset={() => {
              setStage("upload");
              setFile(null);
              setPreview(null);
              setDecisions(new Map());
              setResult(null);
              setPreviewError(null);
              setCommitError(null);
              setCommitPending(null);
            }}
          />
        )}
      </PageBody>
    </PageShell>
  );
}

// ── Upload stage ─────────────────────────────────────────────────────

function UploadStep({
  file,
  setFile,
  previewing,
  onUpload,
  error,
  templateColumns,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  previewing: boolean;
  onUpload: () => void;
  error: string | null;
  templateColumns: string[];
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Label htmlFor="csv-file">CSV file</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={previewing}
        />
        {file && (
          <p className="text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        {error && (
          <PreviewErrorAlert
            message={error}
            templateColumns={templateColumns}
          />
        )}
        <div className="flex justify-end">
          <Button onClick={onUpload} disabled={!file || previewing}>
            {previewing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewErrorAlert({
  message,
  templateColumns,
}: {
  message: string;
  templateColumns: string[];
}) {
  const missing = parseMissingColumns(message);
  return (
    <Alert tone="danger">
      <AlertIcon>
        <AlertTriangle className="h-3.5 w-3.5" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Preview failed</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{message}</p>
          {missing.length > 0 && (
            <div className="text-xs">
              <p className="font-medium">Required columns for this import:</p>
              <ul className="mt-1 list-disc pl-5">
                {templateColumns.map((c) => (
                  <li
                    key={c}
                    className={missing.includes(c) ? "font-semibold" : ""}
                  >
                    <code>{c}</code>
                    {missing.includes(c) ? " — missing" : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Use the “Download CSV template” button above to grab a file with
                the correct headers.
              </p>
            </div>
          )}
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}

function MissingLookupsAlert({
  categories,
  brands,
  creating,
  onCreate,
}: {
  categories: string[];
  brands: string[];
  creating: boolean;
  onCreate: () => void;
}) {
  const parts: string[] = [];
  if (categories.length) {
    parts.push(
      `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`,
    );
  }
  if (brands.length) {
    parts.push(`${brands.length} brand${brands.length === 1 ? "" : "s"}`);
  }
  return (
    <Alert tone="warning">
      <AlertIcon>
        <AlertTriangle className="h-3.5 w-3.5" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Missing {parts.join(" and ")}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            This CSV references {parts.join(" and ")} that don&apos;t exist in
            this location yet. Create them now to keep importing, or fix the CSV
            and re-upload.
          </p>
          {categories.length > 0 && (
            <p className="text-xs">
              <span className="font-medium">Categories:</span>{" "}
              {categories.map((c, i) => (
                <span key={c}>
                  <code>{c}</code>
                  {i < categories.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
          {brands.length > 0 && (
            <p className="text-xs">
              <span className="font-medium">Brands:</span>{" "}
              {brands.map((b, i) => (
                <span key={b}>
                  <code>{b}</code>
                  {i < brands.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
          <Button
            size="sm"
            onClick={onCreate}
            disabled={creating}
            className="mt-1"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : null}
            Create them and re-preview
          </Button>
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}

function collectMissingLookups(
  rows: PreviewRow[],
  type: ImportType,
): { categories: string[]; brands: string[] } {
  if (
    type !== "PRODUCT" &&
    type !== "PRODUCT_WITH_STOCK" &&
    type !== "STOCK_WITH_PRODUCT"
  ) {
    return { categories: [], brands: [] };
  }
  const categories = new Set<string>();
  const brands = new Set<string>();
  for (const r of rows) {
    const cat =
      typeof r.parsed.category === "string" ? r.parsed.category.trim() : "";
    if (cat && !r.parsed.category_id) categories.add(cat);
    const brand =
      typeof r.parsed.brand === "string" ? r.parsed.brand.trim() : "";
    if (brand && !r.parsed.brand_id) brands.add(brand);
  }
  return {
    categories: Array.from(categories),
    brands: Array.from(brands),
  };
}

function parseMissingColumns(message: string): string[] {
  const match = message.match(/missing required columns:\s*(.+)$/i);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function PreviewStep({
  preview,
  decisions,
  setDecision,
  applyPreset,
  applyToGroup,
  previewColumns,
  importableCount,
  committing,
  onCommit,
  onReset,
  type,
  error,
  pending,
  missingLookups,
  creatingLookups,
  onCreateMissingLookups,
}: {
  preview: PreviewResponse;
  decisions: Map<number, RowDecision>;
  setDecision: (rowIndex: number, patch: Partial<RowDecision>) => void;
  applyPreset: (
    preset: "update-existing-create-new" | "skip-existing-create-new",
  ) => void;
  applyToGroup: (rowIndexes: number[], action: Decision) => void;
  previewColumns: { key: string; label: string }[];
  importableCount: number;
  committing: boolean;
  onCommit: () => void;
  onReset: () => void;
  type: ImportType;
  error: string | null;
  pending: string | null;
  missingLookups: { categories: string[]; brands: string[] };
  creatingLookups: boolean;
  onCreateMissingLookups: () => void;
}) {
  const hasMissingLookups =
    missingLookups.categories.length > 0 || missingLookups.brands.length > 0;
  const groups = useMemo(() => groupRows(preview.rows), [preview.rows]);
  const isCatalogue = type !== "STOCK_INTAKE";
  return (
    <div className="space-y-4">
      <SummaryBar summary={preview.summary} type={type} groups={groups} />
      {hasMissingLookups && (
        <MissingLookupsAlert
          categories={missingLookups.categories}
          brands={missingLookups.brands}
          creating={creatingLookups}
          onCreate={onCreateMissingLookups}
        />
      )}
      {isCatalogue && (groups.existing.length > 0 || groups.new.length > 0) && (
        <QuickActionBar
          type={type}
          existingCount={groups.existing.length}
          newCount={groups.new.length}
          similarCount={groups.similar.length}
          onApply={applyPreset}
          disabled={committing}
        />
      )}
      {error && (
        <Alert tone="danger">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>Commit failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </AlertBody>
        </Alert>
      )}
      {pending && (
        <Alert tone="warning">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>Import may still be processing</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{pending}</p>
              <p>
                The server didn&apos;t confirm the result, but the import may
                have finished. Open your list page and check whether these
                records were imported before trying again — re-importing could
                create duplicates.
              </p>
            </AlertDescription>
          </AlertBody>
        </Alert>
      )}
      {isCatalogue ? (
        <>
          <RowSection
            id="errors"
            title="Errors"
            tone="error"
            description="These rows have problems and can only be skipped."
            rows={groups.errors}
            decisions={decisions}
            setDecision={setDecision}
            previewColumns={previewColumns}
            type={type}
            defaultOpen={groups.errors.length > 0}
          />
          <RowSection
            id="existing"
            title="Already in your catalogue"
            tone="info"
            description="The name matches a record that already exists in this location."
            rows={groups.existing}
            decisions={decisions}
            setDecision={setDecision}
            previewColumns={previewColumns}
            type={type}
            bulkActions={
              groups.existing.length > 0
                ? type === "PRODUCT_WITH_STOCK"
                  ? [{ label: "Skip all", action: "SKIP" }]
                  : [
                      { label: "Update all", action: "UPDATE_EXISTING" },
                      { label: "Skip all", action: "SKIP" },
                    ]
                : []
            }
            onBulk={(action) =>
              applyToGroup(
                groups.existing.map((r) => r.rowIndex),
                action,
              )
            }
          />
          <RowSection
            id="similar"
            title="Similar — review individually"
            tone="warning"
            description="The name is close to an existing record but not an exact match. Pick a target or create new."
            rows={groups.similar}
            decisions={decisions}
            setDecision={setDecision}
            previewColumns={previewColumns}
            type={type}
            bulkActions={
              groups.similar.length > 0
                ? [
                    { label: "Create new for all", action: "CREATE" },
                    { label: "Skip all", action: "SKIP" },
                  ]
                : []
            }
            onBulk={(action) =>
              applyToGroup(
                groups.similar.map((r) => r.rowIndex),
                action,
              )
            }
          />
          <RowSection
            id="new"
            title="New"
            tone="success"
            description="No existing record matches — these will be created fresh."
            rows={groups.new}
            decisions={decisions}
            setDecision={setDecision}
            previewColumns={previewColumns}
            type={type}
            bulkActions={
              groups.new.length > 0
                ? [
                    { label: "Create all", action: "CREATE" },
                    { label: "Skip all", action: "SKIP" },
                  ]
                : []
            }
            onBulk={(action) =>
              applyToGroup(
                groups.new.map((r) => r.rowIndex),
                action,
              )
            }
          />
        </>
      ) : (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <PreviewTable
              rows={preview.rows}
              decisions={decisions}
              setDecision={setDecision}
              previewColumns={previewColumns}
              type={type}
            />
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onReset} disabled={committing}>
          Re-upload
        </Button>
        <Button
          onClick={onCommit}
          disabled={committing || importableCount === 0}
        >
          {committing ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : null}
          Import {importableCount} row{importableCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}

interface GroupedRows {
  errors: PreviewRow[];
  existing: PreviewRow[];
  similar: PreviewRow[];
  new: PreviewRow[];
}

function groupRows(rows: PreviewRow[]): GroupedRows {
  const out: GroupedRows = { errors: [], existing: [], similar: [], new: [] };
  for (const r of rows) {
    switch (r.status) {
      case "INVALID_SCHEMA":
      case "MISSING_LOOKUP":
      case "DUPLICATE_IN_FILE":
      case "UNMATCHED":
        out.errors.push(r);
        break;
      case "EXACT_MATCH":
        out.existing.push(r);
        break;
      case "SIMILAR_MATCH":
      case "AMBIGUOUS_MATCH":
        out.similar.push(r);
        break;
      case "READY":
      case "MATCHED":
      default:
        out.new.push(r);
        break;
    }
  }
  return out;
}

function QuickActionBar({
  type,
  existingCount,
  newCount,
  similarCount,
  onApply,
  disabled,
}: {
  type: ImportType;
  existingCount: number;
  newCount: number;
  similarCount: number;
  onApply: (
    preset: "update-existing-create-new" | "skip-existing-create-new",
  ) => void;
  disabled: boolean;
}) {
  const supportsUpdate = type !== "PRODUCT_WITH_STOCK";
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">
            Quick action:
          </span>
          {supportsUpdate && existingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApply("update-existing-create-new")}
              disabled={disabled}
            >
              Update {existingCount} existing · Create {newCount} new
            </Button>
          )}
          {existingCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApply("skip-existing-create-new")}
              disabled={disabled}
            >
              Skip {existingCount} existing · Create {newCount} new
            </Button>
          )}
          {similarCount > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {similarCount} similar match{similarCount === 1 ? "" : "es"} need
              your review below.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryBar({
  summary,
  type,
  groups,
}: {
  summary: PreviewResponse["summary"];
  type: ImportType;
  groups: GroupedRows;
}) {
  if (type === "STOCK_INTAKE") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Total rows" value={summary.totalRows} />
        <SummaryTile label="Matched" value={summary.ready} tone="success" />
        <SummaryTile
          label="Conflicts"
          value={summary.conflicts}
          tone="warning"
        />
        <SummaryTile label="Errors" value={summary.errors} tone="error" />
      </div>
    );
  }
  const existing = summary.existing ?? groups.existing.length;
  const review = groups.similar.length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <SummaryTile label="Total rows" value={summary.totalRows} />
      <SummaryTile label="New" value={groups.new.length} tone="success" />
      <SummaryTile label="Already exists" value={existing} tone="info" />
      <SummaryTile label="Review" value={review} tone="warning" />
      <SummaryTile label="Errors" value={summary.errors} tone="error" />
    </div>
  );
}

function RowSection({
  id,
  title,
  tone,
  description,
  rows,
  decisions,
  setDecision,
  previewColumns,
  type,
  bulkActions = [],
  onBulk,
  defaultOpen,
}: {
  id: string;
  title: string;
  tone: "success" | "warning" | "error" | "info";
  description: string;
  rows: PreviewRow[];
  decisions: Map<number, RowDecision>;
  setDecision: (rowIndex: number, patch: Partial<RowDecision>) => void;
  previewColumns: { key: string; label: string }[];
  type: ImportType;
  bulkActions?: { label: string; action: Decision }[];
  onBulk?: (action: Decision) => void;
  defaultOpen?: boolean;
}) {
  const initiallyOpen =
    defaultOpen ?? (rows.length > 0 && (id !== "new" || rows.length <= 30));
  const [open, setOpen] = useState(initiallyOpen);
  if (rows.length === 0) return null;
  const toneClass = sectionToneClass(tone);
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-left"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{title}</span>
            <Badge variant="outline" className={toneClass}>
              {rows.length}
            </Badge>
          </button>
          {bulkActions.length > 0 && onBulk && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {bulkActions.map((b) => (
                <Button
                  key={b.action + b.label}
                  size="sm"
                  variant="ghost"
                  onClick={() => onBulk(b.action)}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {open && (
          <div className="overflow-x-auto">
            <PreviewTable
              rows={rows}
              decisions={decisions}
              setDecision={setDecision}
              previewColumns={previewColumns}
              type={type}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function sectionToneClass(tone: "success" | "warning" | "error" | "info") {
  switch (tone) {
    case "success":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "error":
      return "bg-red-100 text-red-700";
    case "info":
      return "bg-sky-100 text-sky-700";
  }
}

function PreviewTable({
  rows,
  decisions,
  setDecision,
  previewColumns,
  type,
}: {
  rows: PreviewRow[];
  decisions: Map<number, RowDecision>;
  setDecision: (rowIndex: number, patch: Partial<RowDecision>) => void;
  previewColumns: { key: string; label: string }[];
  type: ImportType;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground border-b">
        <tr>
          <th className="py-2 pr-3">#</th>
          {previewColumns.map((c) => (
            <th
              key={c.key}
              className={`py-2 pr-3 ${isNameColumn(c.key) ? "min-w-[240px]" : ""}`}
            >
              {c.label}
            </th>
          ))}
          <th className="py-2 pr-3">Action</th>
          <th className="py-2 pr-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <RowEditor
            key={r.rowIndex}
            row={r}
            decision={decisions.get(r.rowIndex)}
            setDecision={(patch) => setDecision(r.rowIndex, patch)}
            previewColumns={previewColumns}
            type={type}
          />
        ))}
      </tbody>
    </table>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "error" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "error"
          ? "text-red-600"
          : tone === "info"
            ? "text-sky-600"
            : "";
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-medium ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function RowEditor({
  row,
  decision,
  setDecision,
  previewColumns,
  type,
}: {
  row: PreviewRow;
  decision: RowDecision | undefined;
  setDecision: (patch: Partial<RowDecision>) => void;
  previewColumns: { key: string; label: string }[];
  type: ImportType;
}) {
  const isBlocking =
    row.status === "INVALID_SCHEMA" ||
    row.status === "MISSING_LOOKUP" ||
    row.status === "DUPLICATE_IN_FILE";

  return (
    <>
      <tr className="border-b last:border-0">
        <td className="py-2 pr-3 text-xs text-muted-foreground">
          {row.rowIndex + 2}
        </td>
        {previewColumns.map((c) => (
          <td
            key={c.key}
            className={`py-2 pr-3 ${isNameColumn(c.key) ? "min-w-[240px] font-medium" : ""}`}
          >
            {formatCell(row.parsed[c.key])}
          </td>
        ))}
        <td className="py-2 pr-3">
          <ActionControls
            row={row}
            decision={decision}
            setDecision={setDecision}
            isBlocking={isBlocking}
            type={type}
          />
        </td>
        <td className="py-2 pr-3">
          <StatusBadge status={row.status} />
        </td>
      </tr>
      {(row.errors?.length || row.warnings?.length) && (
        <tr className="border-b last:border-0">
          <td colSpan={previewColumns.length + 3} className="pb-2 pr-3 pl-3">
            {row.errors?.map((e, i) => (
              <p key={`e-${i}`} className="text-xs text-red-600">
                ✗ {e}
              </p>
            ))}
            {row.warnings?.map((w, i) => (
              <p key={`w-${i}`} className="text-xs text-amber-600">
                ⚠ {w}
              </p>
            ))}
          </td>
        </tr>
      )}
    </>
  );
}

function ActionControls({
  row,
  decision,
  setDecision,
  isBlocking,
  type,
}: {
  row: PreviewRow;
  decision: RowDecision | undefined;
  setDecision: (patch: Partial<RowDecision>) => void;
  isBlocking: boolean;
  type: ImportType;
}) {
  if (!decision) return null;
  const allowed = allowedActions(row.status, type);

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={decision.action}
        onValueChange={(v) => setDecision({ action: v as Decision })}
        disabled={isBlocking}
      >
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowed.map((a) => (
            <SelectItem key={a} value={a}>
              {actionLabel(a)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsTarget(decision.action) && row.suggestedMatches?.length ? (
        <Select
          value={decision.targetId ?? ""}
          onValueChange={(v) => setDecision({ targetId: v })}
        >
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Match to…" />
          </SelectTrigger>
          <SelectContent>
            {row.suggestedMatches.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
                {m.subtitle ? ` · ${m.subtitle}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

function isNameColumn(key: string): boolean {
  return key === "name" || key.endsWith("_name");
}

function allowedActions(status: RowStatus, type: ImportType): Decision[] {
  // Blocking statuses can only SKIP.
  if (
    status === "INVALID_SCHEMA" ||
    status === "MISSING_LOOKUP" ||
    status === "DUPLICATE_IN_FILE"
  ) {
    return ["SKIP"];
  }
  if (type === "STOCK_INTAKE") {
    if (status === "UNMATCHED") return ["SKIP"];
    return ["APPLY_INTAKE", "SKIP"];
  }
  // Catalogue imports

  return type === "PRODUCT_WITH_STOCK"
    ? ["CREATE", "SKIP"]
    : ["CREATE", "UPDATE_EXISTING", "SKIP"];
}

function needsTarget(action: Decision): boolean {
  return action === "UPDATE_EXISTING" || action === "APPLY_INTAKE";
}

function actionLabel(action: Decision): string {
  switch (action) {
    case "CREATE":
      return "Create new";
    case "UPDATE_EXISTING":
      return "Update existing";
    case "APPLY_INTAKE":
      return "Apply intake";
    case "SKIP":
      return "Skip";
  }
}

function StatusBadge({ status }: { status: RowStatus }) {
  const config: Record<RowStatus, { label: string; tone: string }> = {
    READY: { label: "Ready", tone: "bg-emerald-100 text-emerald-700" },
    MATCHED: { label: "Matched", tone: "bg-emerald-100 text-emerald-700" },
    EXACT_MATCH: { label: "Exact match", tone: "bg-amber-100 text-amber-800" },
    SIMILAR_MATCH: {
      label: "Similar match",
      tone: "bg-amber-100 text-amber-800",
    },
    AMBIGUOUS_MATCH: {
      label: "Ambiguous",
      tone: "bg-amber-100 text-amber-800",
    },
    UNMATCHED: { label: "Unmatched", tone: "bg-red-100 text-red-700" },
    MISSING_LOOKUP: {
      label: "Missing lookup",
      tone: "bg-red-100 text-red-700",
    },
    INVALID_SCHEMA: { label: "Invalid", tone: "bg-red-100 text-red-700" },
    DUPLICATE_IN_FILE: {
      label: "Duplicate in file",
      tone: "bg-red-100 text-red-700",
    },
  };
  const c = config[status];
  return (
    <Badge variant="outline" className={c.tone}>
      {c.label}
    </Badge>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return JSON.stringify(value);
}

// ── Result stage ─────────────────────────────────────────────────────

function ResultStep({
  result,
  onReset,
}: {
  result: CommitResponse;
  onReset: () => void;
}) {
  const imported = result.created + result.updated;
  const failed = result.errors?.length ?? 0;
  const state: "ok" | "partial" | "failed" =
    failed === 0 ? "ok" : imported > 0 ? "partial" : "failed";

  const Icon =
    state === "ok"
      ? CheckCircle2
      : state === "partial"
        ? AlertTriangle
        : XCircle;
  const iconClass =
    state === "ok"
      ? "text-emerald-600"
      : state === "partial"
        ? "text-amber-600"
        : "text-red-600";
  const heading =
    state === "ok"
      ? "Import complete"
      : state === "partial"
        ? "Imported with some errors"
        : "Nothing imported";

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${iconClass}`} />
          <div>
            <h3 className="text-lg font-medium">{heading}</h3>
            <p className="text-sm text-muted-foreground">
              {result.created} created · {result.updated} updated ·{" "}
              {result.skipped} skipped
              {failed > 0 ? ` · ${failed} failed` : ""}
            </p>
          </div>
        </div>
        {state === "partial" && (
          <Alert tone="warning">
            <AlertIcon>
              <AlertTriangle className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>The rows below weren&apos;t imported</AlertTitle>
              <AlertDescription>
                The other rows were imported successfully. Fix the rows listed
                below in your CSV and re-import just those. On the next preview,
                rows that already imported will show as existing matches —
                leave them on “Skip” so they aren&apos;t created twice.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}
        {failed > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-3 space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-700">
                <FileWarning className="inline h-3 w-3 mr-1" />
                Row {e.rowIndex + 2}: {e.message}
              </p>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={onReset}>
            <Upload className="h-4 w-4 mr-1.5" />
            Import another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
