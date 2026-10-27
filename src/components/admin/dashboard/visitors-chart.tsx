"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

// Single-series area chart of unique visitors per day. Hand-rolled SVG (no
// chart dependency): recessive grid, 2px line, crosshair + tooltip on hover,
// arrow-key navigation, and a visually hidden table for screen readers.

type Point = { date: string; visitors: number };

const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 40 };

const dayLabel = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fullLabel = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const num = new Intl.NumberFormat("en");

function parseDay(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

/** Round the max up to a "nice" axis ceiling (1, 2, 2.5, 5 × 10^n). */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const exp = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * exp >= max) return step * exp;
  }
  return 10 * exp;
}

function axisNumber(n: number) {
  return n >= 1000 ? `${Math.round((n / 1000) * 10) / 10}K` : String(n);
}

export function VisitorsChart({ data }: { data: Point[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, Math.round(entry.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = data.reduce((sum, d) => sum + d.visitors, 0);
  const max = niceMax(Math.max(0, ...data.map((d) => d.visitors)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  const points = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        x:
          PAD.left +
          (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
        y: PAD.top + plotH - (d.visitors / max) * plotH,
      })),
    [data, max, plotW, plotH],
  );

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const baseline = PAD.top + plotH;
  const area =
    points.length > 0
      ? `${line} L${points[points.length - 1].x.toFixed(1)} ${baseline} L${points[0].x.toFixed(1)} ${baseline} Z`
      : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: Math.round(max * f),
    y: PAD.top + plotH - f * plotH,
  }));
  // Keep x labels readable: every day for a week, ~6 labels for a month.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const showMarkers = data.length <= 14;

  const nearestIndex = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * width;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
    }
    return best;
  };

  const activePoint = active !== null ? points[active] : null;

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Unique visitors per day, ${num.format(total)} in total. Use arrow keys to inspect days.`}
        tabIndex={0}
        className="block touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
        onPointerMove={(e) =>
          setActive(
            nearestIndex(e.clientX, e.currentTarget.getBoundingClientRect()),
          )
        }
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((a) => a ?? points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            setActive((a) => {
              const cur = a ?? points.length - 1;
              const next = cur + (e.key === "ArrowRight" ? 1 : -1);
              return Math.min(points.length - 1, Math.max(0, next));
            });
          }
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              style={{ stopColor: "var(--chart-1)", stopOpacity: 0.22 }}
            />
            <stop
              offset="1"
              style={{ stopColor: "var(--chart-1)", stopOpacity: 0 }}
            />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.y}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={t.y}
              y2={t.y}
              className="stroke-border"
              strokeDasharray={t.value === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={t.y}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted-foreground text-[11px]"
            >
              {axisNumber(t.value)}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={p.date}
              x={p.x}
              y={HEIGHT - 8}
              textAnchor={
                i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
              }
              className="fill-muted-foreground text-[11px]"
            >
              {dayLabel.format(parseDay(p.date))}
            </text>
          ) : null,
        )}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {showMarkers
          ? points.map((p) => (
              <circle
                key={p.date}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="var(--chart-1)"
                stroke="var(--card)"
                strokeWidth={2}
              />
            ))
          : null}

        {activePoint ? (
          <g pointerEvents="none">
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={PAD.top}
              y2={baseline}
              className="stroke-muted-foreground/50"
              strokeDasharray="3 3"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={6}
              fill="var(--chart-1)"
              stroke="var(--card)"
              strokeWidth={2}
            />
          </g>
        ) : null}
      </svg>

      {activePoint ? (
        <div
          role="status"
          className="bg-brand-navy pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg ring-1 ring-white/10"
          style={{
            left: Math.min(Math.max(activePoint.x, 70), width - 70),
            top: activePoint.y - 12,
          }}
        >
          <div className="text-white/70">
            {fullLabel.format(parseDay(activePoint.date))}
          </div>
          <div className="font-semibold">
            {num.format(activePoint.visitors)} visitor
            {activePoint.visitors === 1 ? "" : "s"}
          </div>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="text-muted-foreground pointer-events-none absolute inset-x-0 top-[40%] text-center text-sm">
          No visits recorded in this period yet.
        </p>
      ) : null}

      <table className="sr-only">
        <caption>Unique visitors per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Visitors</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{fullLabel.format(parseDay(d.date))}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
