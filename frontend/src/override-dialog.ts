import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant } from "./api";
import { toScheduleInput, updateSchedule } from "./api";
import type { Schedule } from "./types";

/**
 * "Pause" dialog: lets a manager suppress a schedule entirely through a
 * chosen date (e.g. a snow day, a one-off closure) without touching its
 * enabled flag or rules. Auto-reverts once that date has passed - see
 * Schedule.is_overridden/the engine's midnight rescan - so there's nothing
 * to remember to undo. Clearing an active pause early ("Resume now") is a
 * one-click action on the card itself, not routed through this dialog,
 * since it needs no input from the user.
 */
@customElement("scheduler-plus-override-dialog")
export class SchedulerPlusOverrideDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _schedule?: Schedule;

  @state() private _until = "";

  @state() private _saving = false;

  @state() private _error?: string;

  public showDialog(schedule: Schedule): void {
    this._schedule = schedule;
    this._until = schedule.override_until ?? "";
    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _save = async (): Promise<void> => {
    if (!this._schedule) {
      return;
    }
    if (!this._until) {
      this._error = "Pick a date to pause through.";
      return;
    }

    this._saving = true;
    this._error = undefined;
    try {
      await updateSchedule(this.hass, this._schedule.id, {
        ...toScheduleInput(this._schedule),
        override_until: this._until,
      });
      this._open = false;
      this.dispatchEvent(new CustomEvent("schedule-plus-saved"));
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._saving = false;
    }
  };

  protected override render() {
    if (!this._open || !this._schedule) {
      return nothing;
    }
    return html`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Pause "${this._schedule.name}"</div>
          <span class="hint">
            Suppresses this schedule entirely through the date below, then
            resumes automatically the next day - nothing to remember to turn
            back on.
          </span>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <label class="field-label" for="override-until">Paused through</label>
          <input
            id="override-until"
            type="date"
            class="native-input"
            .value=${this._until}
            @input=${(e: Event) => {
              this._until = (e.target as HTMLInputElement).value;
            }}
          />

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Pause
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
    "scheduler-plus-override-dialog": SchedulerPlusOverrideDialog;
  }
}
