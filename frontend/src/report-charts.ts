/**
 * Pure render-data helpers for report-dialog.ts's on-screen chart/timeline,
 * mirroring day-view-dialog.ts's module-scope functions (dayPositionPct/
 * segmentForEvent) but generalized from one calendar day to an arbitrary
 * multi-day date range. No charting library involved - hand-rolled SVG/CSS,
 * matching this codebase's existing bias toward plain native rendering (see
 * entity-multi-picker.ts's documented rationale for avoiding even HA's own
 * richer components).
 */

import type { ReportPoint } from "./api";

/** Where an ISO datetime falls within [rangeStart, rangeEnd], clamped to 0-100. */
export function rangePositionPct(iso: string, rangeStart: string, rangeEnd: string): number {
  const instant = new Date(iso).getTime();
  const start = new Date(rangeStart).getTime();
  const end = new Date(rangeEnd).getTime();
  if (!(end > start)) {
    return 0;
  }
  const pct = ((instant - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, pct));
}

export interface TimelineBar {
  leftPct: number;
  widthPct: number;
  title: string;
}

/**
 * For an on/off entity (light/switch): one bar per "on" window, spanning
 * from each "on" point to whichever comes next (the following "off" point,
 * or the end of the range if it's still on). Points are already compacted
 * transitions (report.py's _compact_points), so consecutive points always
 * alternate in practice - this doesn't assume that, it just draws a bar for
 * every "on" point found.
 */
export function buildTimelineBars(
  points: ReportPoint[],
  rangeStart: string,
  rangeEnd: string,
): TimelineBar[] {
  const bars: TimelineBar[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (!point || point.state !== "on") {
      continue;
    }
    const next = points[i + 1];
    const left = rangePositionPct(point.at, rangeStart, rangeEnd);
    const right = next ? rangePositionPct(next.at, rangeStart, rangeEnd) : 100;
    bars.push({
      leftPct: left,
      widthPct: Math.max(right - left, 0.4),
      title: next
        ? `On: ${formatDateTime(point.at)} → ${formatDateTime(next.at)}`
        : `On since ${formatDateTime(point.at)} (ongoing)`,
    });
  }
  return bars;
}

export interface NumericSeries {
  /** An SVG <path> "d" attribute, in a 0-100 x/y percent viewBox (y inverted: 0 = top/max). */
  path: string;
  min: number;
  max: number;
}

/**
 * Builds an SVG line-chart path for one numeric attribute (e.g. climate's
 * current_temperature or target temperature) across `points`. Returns null
 * when the attribute never appears as a number in this entity's points, so
 * the caller can skip rendering an empty/meaningless chart.
 */
export function numericSeriesPath(
  points: ReportPoint[],
  attribute: string,
  rangeStart: string,
  rangeEnd: string,
): NumericSeries | null {
  const samples = points
    .map((point) => ({ at: point.at, value: point.attributes[attribute] }))
    .filter((sample): sample is { at: string; value: number } => typeof sample.value === "number");
  if (samples.length === 0) {
    return null;
  }

  const values = samples.map((sample) => sample.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const commands = samples.map((sample, index) => {
    const x = rangePositionPct(sample.at, rangeStart, rangeEnd);
    const y = 100 - ((sample.value - min) / span) * 100;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return { path: commands.join(" "), min, max };
}

/** Renders an ISO datetime as e.g. "Aug 24, 6:00 PM", for chart/table labels. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
