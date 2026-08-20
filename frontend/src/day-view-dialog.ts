import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { DayScheduleEvent, HomeAssistant, WeekScheduleDay } from "./api";
import { fetchDaySchedule, fetchWeekSchedule } from "./api";
import { formatAction } from "./format-action";
import type { DeviceType } from "./types";

/** "YYYY-MM-DD" for a Date in local time, not UTC (unlike Date#toISOString). */
function localDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "YYYY-MM-DD" for the caller's local today. */
function todayIso(): string {
  return localDateIso(new Date());
}

/** Renders an ISO datetime's time portion, e.g. "6:00 AM". */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Where an ISO datetime falls on a 24h scale for `dayIso`, as 0-100. An
 * overnight event's off_at on the *next* calendar day clips to 100 (the
 * end of this day's bar) rather than wrapping - the following day's own
 * bar starts fresh at 0, it doesn't show the tail of a rule that started
 * the day before.
 */
function dayPositionPct(iso: string, dayIso: string): number {
  const instant = new Date(iso);
  const instantDayIso = localDateIso(instant);
  if (instantDayIso > dayIso) {
    return 100;
  }
  if (instantDayIso < dayIso) {
    return 0;
  }
  const minutesIntoDay = instant.getHours() * 60 + instant.getMinutes();
  return (minutesIntoDay / (24 * 60)) * 100;
}

interface TimelineSegment {
  leftPct: number;
  widthPct: number;
  title: string;
}

/** One horizontal-bar segment (or a thin point-marker for an on-only/off-only event) per event. */
function timelineSegments(day: WeekScheduleDay): TimelineSegment[] {
  return day.events.map((event): TimelineSegment => {
    const label = `${event.schedule_name} · ${event.rule_name}`;
    if (event.on_at !== null && event.off_at !== null) {
      const left = dayPositionPct(event.on_at, day.date);
      const right = dayPositionPct(event.off_at, day.date);
      return {
        leftPct: left,
        widthPct: Math.max(right - left, 1),
        title: `${label} (${formatTime(event.on_at)} → ${formatTime(event.off_at)})`,
      };
    }
    if (event.on_at !== null) {
      return {
        leftPct: dayPositionPct(event.on_at, day.date),
        widthPct: 1,
        title: `${label} (on at ${formatTime(event.on_at)})`,
      };
    }
    return {
      leftPct: dayPositionPct(event.off_at!, day.date),
      widthPct: 1,
      title: `${label} (off at ${formatTime(event.off_at!)})`,
    };
  });
}

/**
 * Caps a long entity-name list at `max` visible names, e.g. a schedule
 * covering twenty rooms - `full` (all names, comma-separated) goes in a
 * title tooltip so nothing is actually hidden, just decluttered by default.
 */
function summarizeEntityNames(
  names: string[],
  max = 4,
): { visible: string; full: string; overflow: number } {
  const full = names.join(", ");
  if (names.length <= max) {
    return { visible: full, full, overflow: 0 };
  }
  return { visible: names.slice(0, max).join(", "), full, overflow: names.length - max };
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
        <div class="form">
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
    if (this._weekDays.every((day) => day.events.length === 0)) {
      return html`<div class="placeholder">No activity scheduled this week.</div>`;
    }
    return html`
      <div class="week-list">${this._weekDays.map((day) => this._renderWeekDay(day))}</div>
    `;
  }

  private _renderWeekDay(day: WeekScheduleDay) {
    const label = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const isToday = day.date === todayIso();
    const sorted = [...day.events].sort((a, b) =>
      (a.on_at ?? a.off_at ?? "").localeCompare(b.on_at ?? b.off_at ?? ""),
    );
    const segments = timelineSegments(day);
    const now = new Date();
    const nowPct = isToday ? ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100 : null;
    return html`
      <div class="week-day">
        <div class="week-day-header">
          <span class=${isToday ? "today" : ""}>${label}</span>
          ${isToday ? html`<span class="today-badge">Today</span>` : nothing}
        </div>
        <div class="day-timeline" title="12 AM to 12 AM">
          <span class="day-timeline-tick" style="left: 25%"></span>
          <span class="day-timeline-tick" style="left: 50%"></span>
          <span class="day-timeline-tick" style="left: 75%"></span>
          ${segments.map(
            (seg) => html`
              <span
                class="day-timeline-segment"
                style="left: ${seg.leftPct}%; width: ${seg.widthPct}%"
                title=${seg.title}
              ></span>
            `,
          )}
          ${nowPct !== null
            ? html`<span class="day-timeline-now" style="left: ${nowPct}%" title="Now"></span>`
            : nothing}
        </div>
        ${sorted.length === 0
          ? html`<div class="placeholder small">Nothing scheduled</div>`
          : html`<ul class="events">${sorted.map((event) => this._renderEvent(event))}</ul>`}
      </div>
    `;
  }

  private _renderEvent(event: DayScheduleEvent) {
    const overnight =
      event.on_at !== null &&
      event.off_at !== null &&
      event.off_at.slice(0, 10) !== event.on_at.slice(0, 10);
    const action = formatAction(event.device_type, event.action);
    const entities = summarizeEntityNames(event.entities.map((id) => this._entityName(id)));
    return html`
      <li class="event">
        <div class="event-top">
          <span class="event-time">
            ${event.on_at !== null && event.off_at !== null
              ? html`${formatTime(event.on_at)} → ${formatTime(event.off_at)}`
              : event.on_at !== null
                ? html`On at ${formatTime(event.on_at)}`
                : html`Off at ${formatTime(event.off_at!)}`}
          </span>
          ${overnight ? html`<span class="hint">next day</span>` : nothing}
        </div>
        <span class="event-name">${event.schedule_name} · ${event.rule_name}</span>
        ${action ? html`<span class="event-action">${action}</span>` : nothing}
        <span class="event-entities" title=${entities.full}>
          ${entities.visible}${entities.overflow > 0
            ? html` <span class="event-entities-more">+${entities.overflow} more</span>`
            : nothing}
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
      max-width: min(92vw, 520px);
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
    .week-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .week-day {
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .week-day-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.9em;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .week-day-header .today {
      color: var(--primary-color);
    }
    .today-badge {
      font-size: 0.68em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .placeholder.small {
      padding: 0;
      font-size: 0.85em;
      text-align: left;
    }
    .day-timeline {
      position: relative;
      height: 8px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      overflow: hidden;
    }
    .day-timeline-tick {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--card-background-color);
      opacity: 0.6;
    }
    .day-timeline-segment {
      position: absolute;
      top: 0;
      bottom: 0;
      min-width: 3px;
      border-radius: 3px;
      background: var(--primary-color);
      opacity: 0.8;
    }
    .day-timeline-now {
      position: absolute;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: var(--error-color, #db4437);
      border-radius: 1px;
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
      margin-bottom: 18px;
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
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .event {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.035));
    }
    .event-top {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .event-time {
      font-weight: 600;
      font-size: 0.9em;
      color: var(--primary-color);
    }
    .event-name {
      font-size: 0.9em;
      font-weight: 500;
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
    .event-entities-more {
      font-style: italic;
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
