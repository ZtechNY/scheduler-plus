import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { DayScheduleEvent, HomeAssistant } from "./api";
import { fetchDaySchedule } from "./api";
import type { DeviceType } from "./types";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "./types";

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

type DeviceTypeFilter = DeviceType | "all";

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

  @state() private _date = todayIso();

  @state() private _deviceTypeFilter: DeviceTypeFilter = "all";

  @state() private _events: DayScheduleEvent[] = [];

  @state() private _loading = false;

  @state() private _error?: string;

  public showDialog(): void {
    this._date = todayIso();
    this._deviceTypeFilter = "all";
    this._open = true;
    void this._load();
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private async _load(): Promise<void> {
    this._loading = true;
    this._error = undefined;
    try {
      const events = await fetchDaySchedule(
        this.hass,
        this._date,
        this._deviceTypeFilter === "all" ? undefined : this._deviceTypeFilter,
      );
      // The device filter is a card-level (per-dashboard-page) concern, not
      // something the backend endpoint needs to know about - filtered the
      // same way the card's own schedule list already is.
      const filter = this.entityFilter;
      this._events =
        filter && filter.length > 0
          ? events.filter((event) => event.entities.some((id) => filter.includes(id)))
          : events;
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _handleDateChange = (e: Event): void => {
    this._date = (e.target as HTMLInputElement).value;
    void this._load();
  };

  private _handleDeviceTypeChange = (e: Event): void => {
    this._deviceTypeFilter = (e.target as HTMLSelectElement).value as DeviceTypeFilter;
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

          <div class="controls">
            <div class="control">
              <label class="field-label" for="day-view-date">Date</label>
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
                .value=${this._deviceTypeFilter}
                @change=${this._handleDeviceTypeChange}
              >
                <option value="all">All</option>
                ${DEVICE_TYPES.map(
                  (type) => html`<option value=${type}>${DEVICE_TYPE_LABELS[type]}</option>`,
                )}
              </select>
            </div>
          </div>

          <div class="content">${this._renderContent()}</div>

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

    const groups = DEVICE_TYPES.map((type) => ({
      type,
      events: this._events
        .filter((event) => event.device_type === type)
        .sort((a, b) => a.on_at.localeCompare(b.on_at)),
    })).filter((group) => group.events.length > 0);

    return html`
      ${groups.map(
        (group) => html`
          <div class="group">
            <h3 class="group-title">${DEVICE_TYPE_LABELS[group.type]}</h3>
            <ul class="events">
              ${group.events.map((event) => this._renderEvent(event))}
            </ul>
          </div>
        `,
      )}
    `;
  }

  private _renderEvent(event: DayScheduleEvent) {
    const overnight = event.off_at.slice(0, 10) !== event.on_at.slice(0, 10);
    return html`
      <li class="event">
        <span class="event-time">
          ${formatTime(event.on_at)} → ${formatTime(event.off_at)}
          ${overnight ? html`<span class="hint">(next day)</span>` : nothing}
        </span>
        <span class="event-name">${event.schedule_name} · ${event.rule_name}</span>
        <span class="event-entities">${event.entities.join(", ")}</span>
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
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
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
