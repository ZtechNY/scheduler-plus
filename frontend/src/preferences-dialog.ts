import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, Preferences } from "./api";
import { fetchPreferences, updatePreferences } from "./api";
import type { Weekday } from "./types";
import { WEEKDAYS, WEEKDAY_LABELS } from "./types";

/**
 * "My Preferences": each signed-in Home Assistant user's own weekday/
 * weekend/working-hours split, used by the rule editor's Weekdays/Weekend/
 * After hours quick-fill presets. Deliberately not the admin-only options
 * flow (Settings > Devices & Services > Scheduler+ > Configure) - that
 * page is unreachable for non-admin users and, being tied to the config
 * entry, is shared org-wide rather than per-person. This dialog is open to
 * any signed-in user and saves against their own account
 * (websocket_set_preferences keys storage by connection.user.id).
 */
@customElement("scheduler-plus-preferences")
export class SchedulerPlusPreferences extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _weekdayDays: Weekday[] = [];

  @state() private _weekendDays: Weekday[] = [];

  @state() private _workingHoursStart = "09:00";

  @state() private _workingHoursEnd = "17:00";

  @state() private _loading = false;

  @state() private _saving = false;

  @state() private _error?: string;

  public showDialog(): void {
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
      const preferences = await fetchPreferences(this.hass);
      this._weekdayDays = [...preferences.weekday_days];
      this._weekendDays = [...preferences.weekend_days];
      this._workingHoursStart = preferences.working_hours_start.slice(0, 5);
      this._workingHoursEnd = preferences.working_hours_end.slice(0, 5);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  /** A day can't be in both lists at once - picking it for one clears it from the other. */
  private _toggleWeekdayDay = (day: Weekday): void => {
    this._weekdayDays = this._weekdayDays.includes(day)
      ? this._weekdayDays.filter((d) => d !== day)
      : [...this._weekdayDays, day];
    this._weekendDays = this._weekendDays.filter((d) => d !== day);
  };

  private _toggleWeekendDay = (day: Weekday): void => {
    this._weekendDays = this._weekendDays.includes(day)
      ? this._weekendDays.filter((d) => d !== day)
      : [...this._weekendDays, day];
    this._weekdayDays = this._weekdayDays.filter((d) => d !== day);
  };

  private _save = async (): Promise<void> => {
    if (this._weekdayDays.length === 0) {
      this._error = "At least one weekday day is required.";
      return;
    }
    if (this._weekendDays.length === 0) {
      this._error = "At least one weekend day is required.";
      return;
    }

    this._saving = true;
    this._error = undefined;
    try {
      const preferences: Preferences = {
        weekday_days: this._weekdayDays,
        weekend_days: this._weekendDays,
        working_hours_start: this._workingHoursStart,
        working_hours_end: this._workingHoursEnd,
      };
      await updatePreferences(this.hass, preferences);
      this._open = false;
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
          <div class="dialog-title">My preferences</div>
          <span class="hint">
            Your own weekday/weekend/working-hours split, used by the rule
            editor's quick-fill presets. Only affects your account - not
            shared with other users.
          </span>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          ${this._loading
            ? html`<div class="placeholder">Loading…</div>`
            : html`
                <label class="field-label">Weekday days</label>
                <div class="days">
                  ${WEEKDAYS.map(
                    (day) => html`
                      <button
                        type="button"
                        class="day-chip ${this._weekdayDays.includes(day) ? "active" : ""}"
                        @click=${() => this._toggleWeekdayDay(day)}
                      >
                        ${WEEKDAY_LABELS[day].slice(0, 3)}
                      </button>
                    `,
                  )}
                </div>

                <label class="field-label">Weekend days</label>
                <div class="days">
                  ${WEEKDAYS.map(
                    (day) => html`
                      <button
                        type="button"
                        class="day-chip ${this._weekendDays.includes(day) ? "active" : ""}"
                        @click=${() => this._toggleWeekendDay(day)}
                      >
                        ${WEEKDAY_LABELS[day].slice(0, 3)}
                      </button>
                    `,
                  )}
                </div>

                <div class="controls">
                  <div class="control">
                    <label class="field-label" for="working-hours-start">
                      Working hours start
                    </label>
                    <input
                      id="working-hours-start"
                      type="time"
                      class="native-input"
                      .value=${this._workingHoursStart}
                      @input=${(e: Event) => {
                        this._workingHoursStart = (e.target as HTMLInputElement).value;
                      }}
                    />
                  </div>
                  <div class="control">
                    <label class="field-label" for="working-hours-end">
                      Working hours end
                    </label>
                    <input
                      id="working-hours-end"
                      type="time"
                      class="native-input"
                      .value=${this._workingHoursEnd}
                      @input=${(e: Event) => {
                        this._workingHoursEnd = (e.target as HTMLInputElement).value;
                      }}
                    />
                  </div>
                </div>
              `}

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._loading || this._saving}
              @click=${this._save}
            >
              Save
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
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .days {
      display: flex;
      flex-wrap: wrap;
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
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
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
    "scheduler-plus-preferences": SchedulerPlusPreferences;
  }
}
