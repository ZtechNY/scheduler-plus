import { LitElement, css, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { EntityReport, HomeAssistant, Report, ReportPoint } from "./api";
import { fetchReport, reportPdfUrl } from "./api";
import "./entity-multi-picker";
import {
  buildTimelineBars,
  combinedNumericRange,
  formatDateTime,
  formatTemp,
  numericSeriesPath,
  sampleAtTime,
  timeAtPositionPct,
  valueToYPct,
} from "./report-charts";
import { ALL_DEVICE_DOMAINS } from "./types";

/** The two attributes climate's numeric chart plots - shared so bounds/paths/hover all agree. */
const CLIMATE_CHART_ATTRIBUTES = ["current_temperature", "temperature"] as const;

/** What's currently hovered on one entity's numeric chart, for the tooltip/guide line. */
interface ChartHover {
  entityId: string;
  xPct: number;
  time: string;
  actual: number | null;
  target: number | null;
}

/** "YYYY-MM-DD" for a Date in local time, not UTC (unlike Date#toISOString). */
function localDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIso(): string {
  return localDateIso(new Date());
}

/** Default report window: the last 7 days through today. */
function defaultStartIso(): string {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return localDateIso(date);
}

/** "cool" -> "Cool", "hvac_action" style values -> "Heating", etc. */
function humanizeWord(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * A domain-aware, human-readable description of a point's tracked
 * attributes - e.g. "Target 69° · Room 71° · Cooling" for climate,
 * "Brightness 80%" for a light (converted from HA's raw 0-255 scale, which
 * means nothing to someone reading a report), or "" for a switch (its
 * on/off state alone, shown separately, already says everything).
 */
function describeAttributes(domain: string, point: ReportPoint): string {
  if (domain === "climate") {
    const parts: string[] = [];
    const target = point.attributes.temperature;
    const current = point.attributes.current_temperature;
    const action = point.attributes.hvac_action;
    if (typeof target === "number") {
      parts.push(`Target ${formatTemp(target)}`);
    }
    if (typeof current === "number") {
      parts.push(`Room ${formatTemp(current)}`);
    }
    if (typeof action === "string" && action) {
      parts.push(humanizeWord(action));
    }
    return parts.join(" · ");
  }
  if (domain === "light") {
    const brightness = point.attributes.brightness;
    return typeof brightness === "number"
      ? `Brightness ${Math.round((brightness / 255) * 100)}%`
      : "";
  }
  return "";
}

function describeSource(point: ReportPoint): string {
  return point.source === "rule"
    ? `Scheduler+: ${point.rule_name} (${point.schedule_name})`
    : "Other";
}

/**
 * Per domain, which of a point's tracked attributes count as a "real"
 * change worth its own row in the list - as opposed to routine sensor
 * noise that's already visible as a continuous line in the chart above.
 * climate's current_temperature is deliberately excluded: it updates
 * every few minutes just from a room's ambient temperature drifting, and
 * listing every such tick (report.py's backend compaction already treats
 * each distinct reading as a real "transition") buried the moments that
 * actually matter - the target changing, or the system switching between
 * heating/cooling/idle. Nothing is filtered for light/switch: their only
 * tracked signal (state, plus light's brightness) already is the
 * meaningful thing.
 */
const LIST_SIGNIFICANT_KEYS: Record<string, (point: ReportPoint) => unknown> = {
  climate: (point) => `${point.state}|${point.attributes.temperature}|${point.attributes.hvac_action}`,
};

/** Collapses `points` to just the ones significant enough to list - see LIST_SIGNIFICANT_KEYS. */
function significantPoints(points: ReportPoint[], domain: string): ReportPoint[] {
  const keyOf = LIST_SIGNIFICANT_KEYS[domain];
  if (!keyOf) {
    return points;
  }
  const kept: ReportPoint[] = [];
  let lastKey: unknown;
  for (const point of points) {
    const key = keyOf(point);
    if (kept.length === 0 || key !== lastKey) {
      kept.push(point);
      lastKey = key;
    }
  }
  return kept;
}

export interface SchedulerPlusReportCardConfig {
  type: string;
  title?: string;
  /** Restricts the entity picker's default selection - unset/empty lets the user pick freely. */
  entities?: string[];
}

/**
 * "Report" card: pick a set of entities and a date range, see what actually
 * happened to them (state/attribute history from Home Assistant's
 * recorder, annotated with whether a Scheduler+ rule caused each change) -
 * plus a "Download PDF" export of the same data. A standalone Lovelace card
 * (its own `type: custom:scheduler-plus-report-card`) rather than a dialog
 * opened from the main Scheduler+ card - the two are independent enough
 * (reads history, doesn't touch schedules at all) that a dashboard page can
 * carry just this one without the scheduling card, or vice versa. Shares
 * its backend (websocket.py's generate_report command, report_view.py's
 * PDF endpoint) with nothing card-specific about either.
 */
@customElement("scheduler-plus-report-card")
export class SchedulerPlusReportCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config?: SchedulerPlusReportCardConfig;

  @state() private _entities: string[] = [];

  @state() private _startDate = defaultStartIso();

  @state() private _endDate = todayIso();

  @state() private _loading = false;

  @state() private _error?: string;

  @state() private _report?: Report;

  @state() private _hover?: ChartHover;

  static getStubConfig(): SchedulerPlusReportCardConfig {
    return { type: "custom:scheduler-plus-report-card" };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("scheduler-plus-report-card-editor");
  }

  setConfig(config: SchedulerPlusReportCardConfig): void {
    this._config = config;
    this._entities = config.entities ?? [];
  }

  getCardSize(): number {
    return 6;
  }

  private _handleEntitiesChanged = (e: CustomEvent<{ value: string[] }>): void => {
    this._entities = e.detail.value;
  };

  private _handleStartDateChange = (e: Event): void => {
    this._startDate = (e.target as HTMLInputElement).value;
  };

  private _handleEndDateChange = (e: Event): void => {
    this._endDate = (e.target as HTMLInputElement).value;
  };

  private get _canGenerate(): boolean {
    return this._entities.length > 0 && !!this._startDate && !!this._endDate
      && this._startDate <= this._endDate;
  }

  private _generate = async (): Promise<void> => {
    if (!this._canGenerate) {
      this._error = this._entities.length === 0
        ? "Pick at least one entity."
        : "Start date must not be after end date.";
      return;
    }
    this._loading = true;
    this._error = undefined;
    try {
      this._report = await fetchReport(this.hass, this._entities, this._startDate, this._endDate);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  };

  private _downloadPdf = async (): Promise<void> => {
    if (!this._canGenerate) {
      return;
    }
    const headers: HeadersInit = {};
    const accessToken = this.hass.auth?.data?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(reportPdfUrl(this._entities, this._startDate, this._endDate), {
      headers,
    });
    if (!response.ok) {
      throw new Error(`PDF download failed (${response.status} ${response.statusText})`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scheduler-plus-report.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  protected override render() {
    return html`
      <ha-card>
        <div class="header">
          <span>${this._config?.title ?? "Report"}</span>
        </div>
        <div class="content">
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${ALL_DEVICE_DOMAINS}
            @value-changed=${this._handleEntitiesChanged}
          ></scheduler-plus-entity-multi-picker>

          <div class="controls">
            <div class="control">
              <label class="field-label" for="report-start-date">From</label>
              <input
                id="report-start-date"
                type="date"
                class="native-input"
                .value=${this._startDate}
                @change=${this._handleStartDateChange}
              />
            </div>
            <div class="control">
              <label class="field-label" for="report-end-date">To</label>
              <input
                id="report-end-date"
                type="date"
                class="native-input"
                .value=${this._endDate}
                @change=${this._handleEndDateChange}
              />
            </div>
          </div>

          <div class="actions-row">
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._loading}
              @click=${this._generate}
            >
              ${this._loading ? "Generating…" : "Generate"}
            </button>
            <button type="button" class="btn" @click=${this._downloadPdf}>Download PDF</button>
          </div>

          ${this._error ? html`<div class="placeholder error">${this._error}</div>` : nothing}

          ${this._renderResults()}
        </div>
      </ha-card>
    `;
  }

  private _renderResults() {
    if (!this._report) {
      return nothing;
    }
    if (this._report.entities.length === 0) {
      return html`<div class="placeholder">No entities selected.</div>`;
    }
    return html`
      <div class="entities">
        ${this._report.entities.map((entity) => this._renderEntity(entity))}
      </div>
    `;
  }

  private _renderEntity(entity: EntityReport) {
    return html`
      <div class="entity-report">
        <div class="entity-title">${entity.friendly_name}</div>
        ${entity.no_data
          ? html`<div class="placeholder small">
              No data found - may be outside your Home Assistant history retention.
            </div>`
          : html`
              ${this._renderChart(entity)}
              ${entity.truncated
                ? html`<div class="hint">Truncated - too many changes to list them all.</div>`
                : nothing}
              <ul class="points">
                ${significantPoints(entity.points, entity.domain).map(
                  (point) => html`
                    <li class="point">
                      <span class="point-time">${formatDateTime(point.at)}</span>
                      <span class="point-state">${humanizeWord(point.state)}</span>
                      <span class="point-details">${describeAttributes(entity.domain, point)}</span>
                      <span class="point-source ${point.source}">${describeSource(point)}</span>
                    </li>
                  `,
                )}
              </ul>
            `}
      </div>
    `;
  }

  private _renderChart(entity: EntityReport) {
    if (entity.domain === "climate") {
      return this._renderNumericChart(entity);
    }
    return this._renderTimeline(entity);
  }

  private _handleChartMouseMove = (entity: EntityReport, e: MouseEvent): void => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }
    const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const time = timeAtPositionPct(xPct, this._startDate, this._endDate);
    this._hover = {
      entityId: entity.entity_id,
      xPct,
      time,
      actual: sampleAtTime(entity.points, "current_temperature", time),
      target: sampleAtTime(entity.points, "temperature", time),
    };
  };

  private _handleChartMouseLeave = (): void => {
    this._hover = undefined;
  };

  /**
   * Overlays current_temperature (actual) and temperature (target) as two
   * lines on one shared y-axis scale (combinedNumericRange - see its
   * docstring for why a shared scale matters here), with min/max labels and
   * an interactive hover: moving the mouse over the chart shows the exact
   * actual/target value at that moment via a step-function lookup
   * (sampleAtTime), since a recorded attribute holds its value until the
   * next change rather than interpolating.
   */
  private _renderNumericChart(entity: EntityReport) {
    const bounds = combinedNumericRange(entity.points, [...CLIMATE_CHART_ATTRIBUTES]);
    if (!bounds) {
      return nothing;
    }
    const actual = numericSeriesPath(
      entity.points, "current_temperature", bounds, this._startDate, this._endDate,
    );
    const target = numericSeriesPath(
      entity.points, "temperature", bounds, this._startDate, this._endDate,
    );

    const hover = this._hover?.entityId === entity.entity_id ? this._hover : undefined;
    const hoverActualYPct =
      hover?.actual != null ? valueToYPct(hover.actual, bounds) : undefined;
    const hoverTargetYPct =
      hover?.target != null ? valueToYPct(hover.target, bounds) : undefined;

    return html`
      <div class="chart">
        <div class="chart-body">
          <div class="y-axis">
            <span>${formatTemp(bounds.max)}</span>
            <span>${formatTemp(bounds.min)}</span>
          </div>
          <div
            class="chart-plot"
            @mousemove=${(e: MouseEvent) => this._handleChartMouseMove(entity, e)}
            @mouseleave=${this._handleChartMouseLeave}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line class="gridline" x1="0" y1="25" x2="100" y2="25"></line>
              <line class="gridline" x1="0" y1="50" x2="100" y2="50"></line>
              <line class="gridline" x1="0" y1="75" x2="100" y2="75"></line>
              ${actual ? svg`<path class="series actual" d=${actual.path}></path>` : nothing}
              ${target ? svg`<path class="series target" d=${target.path}></path>` : nothing}
              ${hover
                ? svg`
                    <line
                      class="hover-guide"
                      x1=${hover.xPct} y1="0" x2=${hover.xPct} y2="100"
                    ></line>
                    ${hoverActualYPct !== undefined
                      ? svg`<circle class="hover-dot actual" cx=${hover.xPct} cy=${hoverActualYPct} r="2"></circle>`
                      : nothing}
                    ${hoverTargetYPct !== undefined
                      ? svg`<circle class="hover-dot target" cx=${hover.xPct} cy=${hoverTargetYPct} r="2"></circle>`
                      : nothing}
                  `
                : nothing}
            </svg>
            ${hover
              ? html`
                  <div
                    class="chart-tooltip"
                    style="left: ${Math.min(88, Math.max(12, hover.xPct))}%"
                  >
                    <div class="chart-tooltip-time">${formatDateTime(hover.time)}</div>
                    ${hover.actual != null
                      ? html`<div class="chart-tooltip-row actual">
                          Actual: ${formatTemp(hover.actual)}
                        </div>`
                      : nothing}
                    ${hover.target != null
                      ? html`<div class="chart-tooltip-row target">
                          Target: ${formatTemp(hover.target)}
                        </div>`
                      : nothing}
                  </div>
                `
              : nothing}
          </div>
        </div>
        <div class="legend">
          ${actual ? html`<span class="legend-item actual">Actual temperature</span>` : nothing}
          ${target ? html`<span class="legend-item target">Target temperature</span>` : nothing}
        </div>
      </div>
    `;
  }

  private _renderTimeline(entity: EntityReport) {
    const bars = buildTimelineBars(entity.points, this._startDate, this._endDate);
    return html`
      <div class="timeline" title="${this._startDate} to ${this._endDate}">
        ${bars.map(
          (bar) => html`
            <span
              class="timeline-bar"
              style="left: ${bar.leftPct}%; width: ${bar.widthPct}%"
              title=${bar.title}
            ></span>
          `,
        )}
      </div>
    `;
  }

  static override styles = css`
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 4px;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 16px 16px;
    }
    .controls {
      display: flex;
      gap: 12px;
    }
    .control {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .actions-row {
      display: flex;
      gap: 8px;
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.small {
      padding: 8px 0;
      font-size: 0.85em;
    }
    .placeholder.error {
      color: var(--error-color);
      padding: 4px 0;
      text-align: left;
    }
    .hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .entities {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .entity-report {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .entity-title {
      font-size: 0.95em;
      font-weight: 600;
      color: var(--primary-text-color);
      margin-bottom: 8px;
    }
    .timeline {
      position: relative;
      height: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      overflow: hidden;
    }
    .timeline-bar {
      position: absolute;
      top: 0;
      bottom: 0;
      min-width: 2px;
      background: var(--primary-color);
      opacity: 0.85;
    }
    .chart {
      margin-bottom: 10px;
    }
    .chart-body {
      display: flex;
      gap: 6px;
    }
    .y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      flex: none;
      width: 40px;
      padding: 4px 0;
      font-size: 0.7em;
      color: var(--secondary-text-color);
    }
    .chart-plot {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .chart-plot svg {
      width: 100%;
      height: 130px;
      display: block;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
      border-radius: 4px;
      cursor: crosshair;
    }
    .gridline {
      stroke: var(--divider-color);
      stroke-width: 0.5;
      vector-effect: non-scaling-stroke;
    }
    .series {
      fill: none;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .series.actual {
      stroke: var(--primary-color);
    }
    .series.target {
      stroke: var(--warning-color, #ffa600);
      stroke-dasharray: 4 3;
    }
    .hover-guide {
      stroke: var(--secondary-text-color);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      opacity: 0.6;
    }
    .hover-dot {
      vector-effect: non-scaling-stroke;
      stroke: var(--card-background-color);
      stroke-width: 1;
    }
    .hover-dot.actual {
      fill: var(--primary-color);
    }
    .hover-dot.target {
      fill: var(--warning-color, #ffa600);
    }
    .chart-tooltip {
      position: absolute;
      top: 6px;
      transform: translateX(-50%);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78em;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      pointer-events: none;
    }
    .chart-tooltip-time {
      color: var(--secondary-text-color);
      margin-bottom: 2px;
    }
    .chart-tooltip-row.actual {
      color: var(--primary-color);
      font-weight: 600;
    }
    .chart-tooltip-row.target {
      color: var(--warning-color, #ffa600);
      font-weight: 600;
    }
    .legend {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .legend-item.actual::before,
    .legend-item.target::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 2px;
      margin-right: 4px;
      vertical-align: middle;
    }
    .legend-item.actual::before {
      background: var(--primary-color);
    }
    .legend-item.target::before {
      background: var(--warning-color, #ffa600);
    }
    ul.points {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 260px;
      overflow-y: auto;
    }
    .point {
      display: grid;
      grid-template-columns: 96px 48px 1fr auto;
      gap: 8px;
      align-items: baseline;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.8em;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .point-time {
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .point-state {
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .point-details {
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .point-source {
      font-size: 0.9em;
      white-space: nowrap;
      color: var(--secondary-text-color);
    }
    .point-source.rule {
      color: var(--primary-color);
    }
    .btn {
      font: inherit;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-primary:hover {
      filter: brightness(0.95);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-report-card": SchedulerPlusReportCard;
  }
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "scheduler-plus-report-card",
  name: "Scheduler+ Report",
  description: "History report for any entities and date range, with PDF export.",
});
