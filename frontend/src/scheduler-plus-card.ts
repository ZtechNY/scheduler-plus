import { mdiDelete, mdiPencil } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { HassEntityState, HomeAssistant } from "./api";
import { deleteSchedule, fetchSchedules } from "./api";
import "./schedule-editor-dialog";
import type { SchedulerPlusScheduleEditor } from "./schedule-editor-dialog";
import type { Schedule } from "./types";
import { DEVICE_TYPE_LABELS } from "./types";

/** Formats a schedule's next-event sensor state as e.g. "Next: On Fri, 6:00 AM". */
function formatNextEvent(entry: HassEntityState | undefined): string | undefined {
  if (!entry || entry.state === "unknown" || entry.state === "unavailable") {
    return undefined;
  }
  const when = new Date(entry.state);
  if (Number.isNaN(when.getTime())) {
    return undefined;
  }
  const action = entry.attributes.action === "off" ? "Off" : "On";
  const formatted = when.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Next: ${action} ${formatted}`;
}

export interface SchedulerPlusCardConfig {
  type: string;
  title?: string;
}

@customElement("scheduler-plus-card")
export class SchedulerPlusCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config?: SchedulerPlusCardConfig;

  @state() private _schedules: Schedule[] = [];

  @state() private _loading = true;

  @state() private _error?: string;

  @query("scheduler-plus-schedule-editor")
  private _editor?: SchedulerPlusScheduleEditor;

  static getStubConfig(): SchedulerPlusCardConfig {
    return { type: "custom:scheduler-plus-card" };
  }

  setConfig(config: SchedulerPlusCardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 2 + this._schedules.length;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Fetched once on connect, and again after this card's own mutations -
    // deliberately NOT on every `hass` property update, since Lovelace
    // assigns a fresh `hass` object on essentially every state change
    // across the whole instance. Refetching here on every such update
    // would spam our own websocket API far more than needed.
    void this._refresh();
  }

  private async _refresh(): Promise<void> {
    this._loading = true;
    try {
      this._schedules = await fetchSchedules(this.hass);
      this._error = undefined;
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private async _handleDelete(schedule: Schedule): Promise<void> {
    if (!window.confirm(`Delete schedule "${schedule.name}"?`)) {
      return;
    }
    await deleteSchedule(this.hass, schedule.id);
    await this._refresh();
  }

  /**
   * Looks up a schedule's "next event" sensor by unique_id (ScheduleNextEventSensor
   * sets `{schedule_id}_next_event`, see sensor.py) rather than a guessed
   * entity_id, since the entity's name - and therefore its default
   * entity_id - is derived from the schedule's own (user-editable) name.
   */
  private _nextEventFor(scheduleId: string): HassEntityState | undefined {
    const entityId = Object.values(this.hass.entities ?? {}).find(
      (entity) => entity.unique_id === `${scheduleId}_next_event`,
    )?.entity_id;
    return entityId ? this.hass.states[entityId] : undefined;
  }

  private _openAddDialog = (): void => {
    this._editor?.showDialog();
  };

  private _openEditDialog = (schedule: Schedule): void => {
    this._editor?.showDialog(schedule);
  };

  protected override render() {
    return html`
      <ha-card .header=${this._config?.title ?? "Scheduler+"}>
        <div class="content">${this._renderContent()}</div>
        <div class="card-actions">
          <mwc-button @click=${this._openAddDialog}>Add schedule</mwc-button>
        </div>
      </ha-card>
      <scheduler-plus-schedule-editor
        .hass=${this.hass}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-schedule-editor>
    `;
  }

  private _renderContent() {
    if (this._loading) {
      return html`<div class="placeholder">Loading schedules…</div>`;
    }
    if (this._error) {
      return html`<div class="placeholder error">${this._error}</div>`;
    }
    if (this._schedules.length === 0) {
      return html`<div class="placeholder">No schedules yet.</div>`;
    }
    return html`
      <ul class="schedules">
        ${this._schedules.map((schedule) => this._renderSchedule(schedule))}
      </ul>
    `;
  }

  private _renderSchedule(schedule: Schedule) {
    const nextEvent = schedule.enabled
      ? formatNextEvent(this._nextEventFor(schedule.id))
      : undefined;
    return html`
      <li class="schedule ${schedule.enabled ? "" : "disabled"}">
        <div class="schedule-info">
          <span class="schedule-name">${schedule.name}</span>
          <span class="schedule-meta">
            ${DEVICE_TYPE_LABELS[schedule.device_type]} ·
            ${schedule.entities.length}
            ${schedule.entities.length === 1 ? "entity" : "entities"} ·
            ${schedule.rules.length}
            ${schedule.rules.length === 1 ? "rule" : "rules"}
          </span>
          ${nextEvent ? html`<span class="schedule-next">${nextEvent}</span>` : nothing}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${mdiPencil}
            label="Edit"
            @click=${() => this._openEditDialog(schedule)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiDelete}
            label="Delete"
            @click=${() => this._handleDelete(schedule)}
          ></ha-icon-button>
        </div>
      </li>
    `;
  }

  static override styles = css`
    .content {
      padding: 0 16px 16px;
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.error {
      color: var(--error-color);
    }
    ul.schedules {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .schedule {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .schedule:last-child {
      border-bottom: none;
    }
    .schedule.disabled .schedule-name {
      color: var(--disabled-text-color);
    }
    .schedule-info {
      display: flex;
      flex-direction: column;
    }
    .schedule-name {
      font-weight: 500;
    }
    .schedule-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .schedule-next {
      font-size: 0.85em;
      color: var(--primary-color);
    }
    .row-actions {
      display: flex;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 8px 8px 16px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-card": SchedulerPlusCard;
  }
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "scheduler-plus-card",
  name: "Scheduler+",
  description: "Visual scheduling for lights and climate devices.",
});
