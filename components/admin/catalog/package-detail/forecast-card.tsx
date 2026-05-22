"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";

import { getPackageForecast } from "@/lib/actions/admin/package-analytics";
import {
  PackageForecast,
  PackageForecastModel,
  PackageTimeSeriesPoint,
} from "@/types/admin/billing";

interface ForecastCardProps {
  packageId: string;
  basePrice: number;
  initial: PackageForecast;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString();
}

const MODEL_LABEL: Record<PackageForecastModel, string> = {
  linear: "Linear trend",
  arima: "ARIMA",
  prophet: "Prophet",
};

function mergeSeries(forecast: PackageForecast) {
  // recharts works best with one row per x-tick — fold the three
  // parallel series into shared rows keyed on date.
  const upperByDate = new Map<string, number>();
  forecast.upper.forEach((p) => upperByDate.set(p.date, p.value));
  const lowerByDate = new Map<string, number>();
  forecast.lower.forEach((p) => lowerByDate.set(p.date, p.value));
  return forecast.points.map((p) => ({
    date: p.date,
    label: formatShortDate(p.date),
    value: p.value,
    upper: upperByDate.get(p.date) ?? p.value,
    lower: lowerByDate.get(p.date) ?? p.value,
  }));
}

export function ForecastCard({
  packageId,
  basePrice,
  initial,
}: ForecastCardProps) {
  const [forecast, setForecast] = useState<PackageForecast>(initial);
  const [model, setModel] = useState<PackageForecastModel>(initial.model);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (model === forecast.model) return;
    startTransition(async () => {
      const next = await getPackageForecast(
        packageId,
        basePrice,
        model,
        forecast.horizonDays,
      );
      setForecast(next);
    });
  }, [model, packageId, basePrice, forecast.model, forecast.horizonDays]);

  const data = useMemo(() => mergeSeries(forecast), [forecast]);
  const horizonTotal = forecast.points.reduce(
    (sum: number, p: PackageTimeSeriesPoint) => sum + p.value,
    0,
  );

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Revenue forecast · next {forecast.horizonDays} days
          </h2>
          <p className="font-mono text-[11.5px] text-muted-foreground">
            Daily revenue projection with a 95% confidence band.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!forecast.isLive && <StubBadge />}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
              Model
            </span>
            <Select
              value={model}
              onValueChange={(v) => setModel(v as PackageForecastModel)}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 w-[150px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">
                  {MODEL_LABEL.linear}
                </SelectItem>
                <SelectItem value="arima">{MODEL_LABEL.arima}</SelectItem>
                <SelectItem value="prophet">
                  {MODEL_LABEL.prophet}
                </SelectItem>
              </SelectContent>
            </Select>
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="font-mono text-[12px] text-ink tabular-nums">
            Total: {formatCurrency(horizonTotal)}
          </p>
        </div>
      </header>

      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="pkg-forecast-band" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.04}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const label =
                  name === "value"
                    ? "Forecast"
                    : name === "upper"
                      ? "Upper 95%"
                      : name === "lower"
                        ? "Lower 95%"
                        : name;
                return [formatCurrency(value), label];
              }}
              labelFormatter={(l) => l}
            />
            {/*
              Draw the confidence band by stacking two areas: a tall
              "upper" with the gradient fill, then a "lower" with the
              card background colour layered on top so the visible band
              spans only `upper - lower`. recharts doesn't expose a
              first-class band primitive so this is the cleanest hack.
            */}
            <Area
              dataKey="upper"
              type="monotone"
              stroke="none"
              fill="url(#pkg-forecast-band)"
              isAnimationActive={false}
            />
            <Area
              dataKey="lower"
              type="monotone"
              stroke="none"
              fill="hsl(var(--card))"
              isAnimationActive={false}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {forecast.note && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {forecast.note}
        </p>
      )}
    </section>
  );
}
