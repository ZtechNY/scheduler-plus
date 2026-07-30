import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, RuleInput, ScheduleInput } from "./api";
import { createSchedule } from "./api";
import "./entity-multi-picker";
import { DEVICE_TYPE_DOMAINS, WEEKDAYS } from "./types";

/** Local "YYYY-MM-DD" for today, used as the dialog's default event date. */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * "Quick event": a lightweight one-off schedule for a single date (e.g. "keep
 * the gym lights on until 10pm for tonight's event"), without the full
 * Add Schedule flow's days/date-filter/action fields. Under the hood this
 * is nothing new server-side - just a single Schedule with one Rule whose
 * date_mode is "include" and whose `dates` names exactly this one day, a
 * pattern the schema and engine already fully support. Scoped to lights
 * and switches only (no brightness/transition/hvac fields); a one-off
 * climate event still goes through the full Add Schedule flow, since
 * target temperature matters more there than it's worth adding here.
 */
@customElement("scheduler-plus-quick-event-dialog")
export class SchedulerPlusQuickEventDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  /** The owning card's own device filter, if configured - see schedule-editor-dialog.ts. */
  @property({ attribute: false }) entityFilter?: string[];

  @state() private _open = false;

  @state() private _entities: string[] = [];

  @state() private _name = "";

  @state() private _date = todayIso();

  @state() private _onTime = "18:00";

  @state() private _offTime = "22:00";

  @state() private _saving = false;

  @state() private _error?: string;

  public showDialog(): void {
    this._entities = [];
    this._date = todayIso();
    this._name = "";
    this._onTime = "18:00";
    this._offTime = "22:00";
    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _save = async (): Promise<void> => {
    if (this._entities.length === 0) {
      this._error = "At least one entity is required.";
      return;
    }

    this._saving = true;
    this._error = undefined;
    try {
      const rule: RuleInput = {
        name: "Quick event",
        enabled: true,
        days: [...WEEKDAYS],
        date_mode: "include",
        dates: [this._date],
        date_ranges: [],
        day_conditions: [],
        on_time: { provider: "fixed", params: { time: this._onTime } },
        off_time: { provider: "fixed", params: { time: this._offTime } },
        on_enabled: true,
        off_enabled: true,
        allow_override: true,
        override_grace_minutes: 15,
        action: {},
      };
      const input: ScheduleInput = {
        name: this._name.trim() || `Event – ${this._date}`,
        device_type: "light_switch",
        entities: this._entities,
        enabled: true,
        rules: [rule],
      };
      await createSchedule(this.hass, input);
      this._open = false;
      this.dispatchEvent(new CustomEvent("schedule-plus-saved"));
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._saving = false;
    }
  };

  protected override render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Quick event</div>
          <span class="hint">
            A one-off on/off for a single date - lights and switches only.
            For climate or a recurring schedule, use Add schedule instead.
          </span>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <label class="field-label" for="event-name">Name</label>
          <input
            id="event-name"
            type="text"
            class="native-input"
            placeholder="Event – ${this._date}"
            .value=${this._name}
            @input=${(e: Event) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
          />

          <label class="field-label">Entities</label>
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${DEVICE_TYPE_DOMAINS.light_switch}
            .includeEntities=${this.entityFilter}
            @value-changed=${(e: CustomEvent<{ value: string[] }>) => {
              this._entities = e.detail.value;
            }}
          ></scheduler-plus-entity-multi-picker>

          <label class="field-label" for="event-date">Date</label>
          <input
            id="event-date"
            type="date"
            class="native-input"
            .value=${this._date}
            @input=${(e: Event) => {
              this._date = (e.target as HTMLInputElement).value;
            }}
          />

          <div class="time-columns">
            <div class="time-field">
              <label class="field-label" for="event-on-time">On</label>
              <input
                id="event-on-time"
                type="time"
                class="native-input"
                .value=${this._onTime}
                @input=${(e: Event) => {
                  this._onTime = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
            <div class="time-field">
              <label class="field-label" for="event-off-time">Off</label>
              <input
                id="event-off-time"
                type="time"
                class="native-input"
                .value=${this._offTime}
                @input=${(e: Event) => {
                  this._offTime = (e.target as HTMLInputElement).value;
                }}
              />
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Create
            </button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 320px;
      max-width: 420px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color);
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
    .time-columns {
      display: flex;
      gap: 12px;
    }
    .time-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
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
    "scheduler-plus-quick-event-dialog": SchedulerPlusQuickEventDialog;
  }
}
