import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { DayScheduleEvent, HomeAssistant, WeekScheduleDay } from "./api";
import { fetchDaySchedule, fetchWeekSchedule } from "./api";
import type { DeviceType } from "./types";
import { CLIMATE_HVAC_MODE_LABELS } from "./types";

/** "YYYY-MM-DD" for the caller's local today, not UTC (unlike Date#toISOString). */
function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Renders an ISO datetime's time portion, e.g. "6:00 AM". */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Describes what an "on" occurrence actually does, e.g. "Heat · 70°" or
 * "Brightness 60%". Returns undefined when the action has nothing worth
 * calling out (a switch, or a light/climate rule with no extra params set)
 * - the on/off time already conveys the whole story in that case.
 */
function formatAction(deviceType: DeviceType, action: Record<string, unknown>): string | undefined {
  if (deviceType === "light") {
    const parts: string[] = [];
    if (typeof action.brightness === "number") {
      parts.push(`Brightness ${Math.round((action.brightness / 255) * 100)}%`);
    }
    if (typeof action.transition === "number" && action.transition > 0) {
      parts.push(`fade ${action.transition}s`);
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }
  if (deviceType === "climate") {
    const parts: string[] = [];
    if (typeof action.hvac_mode === "string") {
      const labels: Record<string, string> = CLIMATE_HVAC_MODE_LABELS;
      parts.push(labels[action.hvac_mode] ?? action.hvac_mode);
    }
    if (typeof action.target_temperature === "number") {
      parts.push(`${action.target_temperature}°`);
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }
  return undefined;
}

/**
 * How events group in the report. Light and switch are merged into one
 * "Lights & Switches" bucket - most users don't think in terms of that
 * technical distinction, they just think "things that turn on and off".
 * Climate stays on its own since it's genuinely a different kind of
 * control (HVAC mode/temperature, not just on/off).
 */
type ReportGroup = "devices" | "climate";

const REPORT_GROUPS: readonly ReportGroup[] = ["devices", "climate"];

const REPORT_GROUP_LABELS: Record<ReportGroup, string> = {
  devices: "Lights & Switches",
  climate: "Climate",
};

function reportGroupFor(deviceType: DeviceType): ReportGroup {
  return deviceType === "climate" ? "climate" : "devices";
}

type ReportFilter = "all" | ReportGroup;

const REPORT_FILTERS: readonly ReportFilter[] = ["all", ...REPORT_GROUPS];

const REPORT_FILTER_LABELS: Record<ReportFilter, string> = {
  all: "All",
  ...REPORT_GROUP_LABELS,
};

/**
 * Read-only "Day view" report: pick a date (and optionally a device type),
 * see every rule occurrence across all schedules for that day, grouped by
 * device type. Purely a reporting view - it fetches from
 * scheduler_plus/get_day_schedule and never mutates anything, unlike every
 * other dialog in this card.
 */
@customElement("scheduler-plus-day-view")
export class SchedulerPlusDayView extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  /** The owning card's own device filter, if configured - see scheduler-plus-card.ts. */
  @property({ attribute: false }) entityFilter?: string[];

  @state() private _open = false;

  @state() private _viewMode: "day" | "week" = "day";

  @state() private _date = todayIso();

  @state() private _reportFilter: ReportFilter = "all";

  @state() private _events: DayScheduleEvent[] = [];

  @state() private _weekDays: WeekScheduleDay[] = [];

  @state() private _loading = false;

  @state() private _error?: string;

  public showDialog(): void {
    this._viewMode = "day";
    this._date = todayIso();
    this._reportFilter = "all";
    this._open = true;
    void this._load();
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  /** The entity's friendly name, falling back to its entity_id if unknown. */
  private _entityName(entityId: string): string {
    const friendlyName = this.hass.states[entityId]?.attributes.friendly_name;
    return typeof friendlyName === "string" ? friendlyName : entityId;
  }

  /**
   * Applies the report-group filter and the card's own device filter, the
   * same two client-side filters day and week mode both need - neither is
   * something the backend endpoints take directly: "Lights & Switches"
   * spans two backend DeviceTypes (no single value to send), and the
   * card's entity filter is a card-level (per-dashboard-page) concern.
   */
  private _matchesFilters(event: DayScheduleEvent): boolean {
    if (this._reportFilter !== "all" && reportGroupFor(event.device_type) !== this._reportFilter) {
      return false;
    }
    const filter = this.entityFilter;
    if (filter && filter.length > 0 && !event.entities.some((id) => filter.includes(id))) {
      return false;
    }
    return true;
  }

  private async _load(): Promise<void> {
    this._loading = true;
    this._error = undefined;
    try {
      if (this._viewMode === "day") {
        const events = await fetchDaySchedule(this.hass, this._date);
        this._events = events.filter((event) => this._matchesFilters(event));
      } else {
        const days = await fetchWeekSchedule(this.hass, this._date);
        this._weekDays = days.map((day) => ({
          date: day.date,
          events: day.events.filter((event) => this._matchesFilters(event)),
        }));
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _handleViewModeChange = (mode: "day" | "week"): void => {
    this._viewMode = mode;
    void this._load();
  };

  private _handleDateChange = (e: Event): void => {
    this._date = (e.target as HTMLInputElement).value;
    void this._load();
  };

  private _handleReportFilterChange = (e: Event): void => {
    this._reportFilter = (e.target as HTMLSelectElement).value as ReportFilter;
    void this._load();
  };

  protected override render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form ${this._viewMode === "week" ? "form-wide" : ""}">
          <div class="dialog-title">Day view</div>

          <div class="view-toggle">
            <button
              type="button"
              class="day-chip ${this._viewMode === "day" ? "active" : ""}"
              @click=${() => this._handleViewModeChange("day")}
            >
              Day
            </button>
            <button
              type="button"
              class="day-chip ${this._viewMode === "week" ? "active" : ""}"
              @click=${() => this._handleViewModeChange("week")}
            >
              Week
            </button>
          </div>

          <div class="controls">
            <div class="control">
              <label class="field-label" for="day-view-date">
                ${this._viewMode === "week" ? "Week starting" : "Date"}
              </label>
              <input
                id="day-view-date"
                type="date"
                class="native-input"
                .value=${this._date}
                @change=${this._handleDateChange}
              />
            </div>
            <div class="control">
              <label class="field-label" for="day-view-device-type">Device type</label>
              <select
                id="day-view-device-type"
                class="native-select"
                .value=${this._reportFilter}
                @change=${this._handleReportFilterChange}
              >
                ${REPORT_FILTERS.map(
                  (filter) => html`<option value=${filter}>${REPORT_FILTER_LABELS[filter]}</option>`,
                )}
              </select>
            </div>
          </div>

          <div class="content">
            ${this._viewMode === "day" ? this._renderContent() : this._renderWeekContent()}
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  private _renderContent() {
    if (this._loading) {
      return html`<div class="placeholder">Loading…</div>`;
    }
    if (this._error) {
      return html`<div class="placeholder error">${this._error}</div>`;
    }
    if (this._events.length === 0) {
      return html`<div class="placeholder">No activity scheduled for this day.</div>`;
    }

    const groups = REPORT_GROUPS.map((group) => ({
      group,
      events: this._events
        .filter((event) => reportGroupFor(event.device_type) === group)
        .sort((a, b) => (a.on_at ?? a.off_at ?? "").localeCompare(b.on_at ?? b.off_at ?? "")),
    })).filter((g) => g.events.length > 0);

    return html`
      ${groups.map(
        (g) => html`
          <div class="group">
            <h3 class="group-title">${REPORT_GROUP_LABELS[g.group]}</h3>
            <ul class="events">
              ${g.events.map((event) => this._renderEvent(event))}
            </ul>
          </div>
        `,
      )}
    `;
  }

  private _renderWeekContent() {
    if (this._loading) {
      return html`<div class="placeholder">Loading…</div>`;
    }
    if (this._error) {
      return html`<div class="placeholder error">${this._error}</div>`;
    }
    return html`
      <div class="week-grid-scroll">
        <div class="week-grid">${this._weekDays.map((day) => this._renderWeekDay(day))}</div>
      </div>
    `;
  }

  private _renderWeekDay(day: WeekScheduleDay) {
    const label = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const sorted = [...day.events].sort((a, b) =>
      (a.on_at ?? a.off_at ?? "").localeCompare(b.on_at ?? b.off_at ?? ""),
    );
    return html`
      <div class="week-day">
        <div class="week-day-header">${label}</div>
        ${sorted.length === 0
          ? html`<span class="hint">Nothing scheduled</span>`
          : html`
              <ul class="week-events">
                ${sorted.map((event) => this._renderWeekEvent(event))}
              </ul>
            `}
      </div>
    `;
  }

  private _renderWeekEvent(event: DayScheduleEvent) {
    const time =
      event.on_at !== null
        ? formatTime(event.on_at)
        : event.off_at !== null
          ? formatTime(event.off_at)
          : "";
    return html`
      <li class="week-event" title="${event.schedule_name} · ${event.rule_name}">
        <span class="week-event-time">${time}</span>
        <span class="week-event-name">${event.schedule_name}</span>
      </li>
    `;
  }

  private _renderEvent(event: DayScheduleEvent) {
    const overnight =
      event.on_at !== null &&
      event.off_at !== null &&
      event.off_at.slice(0, 10) !== event.on_at.slice(0, 10);
    const action = formatAction(event.device_type, event.action);
    return html`
      <li class="event">
        <span class="event-time">
          ${event.on_at !== null && event.off_at !== null
            ? html`${formatTime(event.on_at)} → ${formatTime(event.off_at)}`
            : event.on_at !== null
              ? html`On at ${formatTime(event.on_at)}`
              : html`Off at ${formatTime(event.off_at!)}`}
          ${overnight ? html`<span class="hint">(next day)</span>` : nothing}
        </span>
        <span class="event-name">${event.schedule_name} · ${event.rule_name}</span>
        ${action ? html`<span class="event-action">${action}</span>` : nothing}
        <span class="event-entities">
          ${event.entities.map((id) => this._entityName(id)).join(", ")}
        </span>
      </li>
    `;
  }

  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      max-width: 460px;
    }
    .form-wide {
      max-width: min(92vw, 900px);
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .view-toggle {
      display: flex;
      gap: 4px;
    }
    .day-chip {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 6px 12px;
      cursor: pointer;
    }
    .day-chip.active {
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
    .week-grid-scroll {
      overflow-x: auto;
    }
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(110px, 1fr));
      gap: 8px;
    }
    .week-day {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 8px;
    }
    .week-day-header {
      font-size: 0.8em;
      font-weight: 600;
      color: var(--secondary-text-color);
    }
    ul.week-events {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
    }
    .week-event {
      display: flex;
      flex-direction: column;
      font-size: 0.78em;
      line-height: 1.3;
    }
    .week-event-time {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .week-event-name {
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .native-select,
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .content {
      min-height: 80px;
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.error {
      color: var(--error-color);
    }
    .group {
      margin-bottom: 16px;
    }
    .group:last-child {
      margin-bottom: 0;
    }
    .group-title {
      margin: 0 0 8px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--secondary-text-color);
    }
    ul.events {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .event {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .event:last-child {
      border-bottom: none;
    }
    .event-time {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .event-name {
      font-size: 0.9em;
      color: var(--primary-text-color);
    }
    .event-action {
      font-size: 0.85em;
      color: var(--primary-color);
    }
    .event-entities {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-day-view": SchedulerPlusDayView;
  }
}
