/**
 * Pure render-data helpers for report-card.ts's on-screen chart/timeline,
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

/** Inverse of rangePositionPct: the ISO instant at a given 0-100 position within [rangeStart, rangeEnd]. */
export function timeAtPositionPct(pct: number, rangeStart: string, rangeEnd: string): string {
  const start = new Date(rangeStart).getTime();
  const end = new Date(rangeEnd).getTime();
  const clamped = Math.min(100, Math.max(0, pct));
  return new Date(start + ((end - start) * clamped) / 100).toISOString();
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

/** One attribute's numeric samples extracted from a point list, paired with their timestamps. */
function numericSamples(
  points: ReportPoint[],
  attribute: string,
): { at: string; value: number }[] {
  return points
    .map((point) => ({ at: point.at, value: point.attributes[attribute] }))
    .filter((sample): sample is { at: string; value: number } => typeof sample.value === "number");
}

export interface ChartBounds {
  min: number;
  max: number;
}

/**
 * A single shared y-axis range across every attribute passed in, padded by
 * ~8% of the span on each side so a line never touches the very top/bottom
 * edge. Sharing one range across e.g. both "actual" and "target"
 * temperature is what makes them vertically comparable at a glance - each
 * series computing its own independent min/max (the first version of this
 * chart) made a nearly-constant target line collapse to a flat line
 * wherever it happened to fall, unrelated to where the actual line sat.
 * Returns null if none of the given attributes ever appear as numbers.
 */
export function combinedNumericRange(
  points: ReportPoint[],
  attributes: string[],
): ChartBounds | null {
  const values = attributes.flatMap((attribute) =>
    numericSamples(points, attribute).map((sample) => sample.value),
  );
  if (values.length === 0) {
    return null;
  }
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin || Math.abs(rawMax) || 1;
  const pad = span * 0.08;
  return { min: rawMin - pad, max: rawMax + pad };
}

/** Where a value falls within `bounds` on the chart's 0-100 y-axis (0 = top/max, 100 = bottom/min). */
export function valueToYPct(value: number, bounds: ChartBounds): number {
  const span = bounds.max - bounds.min || 1;
  return 100 - ((value - bounds.min) / span) * 100;
}

export interface NumericSeries {
  /** An SVG <path> "d" attribute, in a 0-100 x/y percent viewBox (y inverted: 0 = top/max). */
  path: string;
}

/**
 * Builds an SVG line-chart path for one numeric attribute (e.g. climate's
 * current_temperature or target temperature) across `points`, scaled
 * against a caller-supplied shared `bounds` (see combinedNumericRange) so
 * multiple series overlay meaningfully. Returns null when the attribute
 * never appears as a number in this entity's points, so the caller can
 * skip rendering an empty/meaningless line.
 */
export function numericSeriesPath(
  points: ReportPoint[],
  attribute: string,
  bounds: ChartBounds,
  rangeStart: string,
  rangeEnd: string,
): NumericSeries | null {
  const samples = numericSamples(points, attribute);
  if (samples.length === 0) {
    return null;
  }

  const commands = samples.map((sample, index) => {
    const x = rangePositionPct(sample.at, rangeStart, rangeEnd);
    const y = valueToYPct(sample.value, bounds);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return { path: commands.join(" ") };
}

/**
 * The value of `attribute` as of `atIso` - the most recent sample at or
 * before that instant, matching the step-function nature of a recorded
 * attribute (it holds its last value until the next change, it doesn't
 * interpolate between samples). Falls back to the first known sample when
 * `atIso` is before every sample, so hovering near the left edge of the
 * chart still shows a value rather than nothing. Returns null only when
 * the attribute has no numeric samples at all.
 */
export function sampleAtTime(
  points: ReportPoint[],
  attribute: string,
  atIso: string,
): number | null {
  const samples = numericSamples(points, attribute);
  if (samples.length === 0) {
    return null;
  }
  const atMs = new Date(atIso).getTime();
  let current = samples[0]!;
  for (const sample of samples) {
    if (new Date(sample.at).getTime() > atMs) {
      break;
    }
    current = sample;
  }
  return current.value;
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

/** Renders a numeric attribute value (e.g. a temperature) rounded to one decimal, with a degree mark. */
export function formatTemp(value: number): string {
  return `${Math.round(value * 10) / 10}°`;
}
