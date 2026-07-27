import { mdiDelete, mdiPencil } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { HomeAssistant } from "./api";
import { deleteSchedule, fetchSchedules, updateSchedule } from "./api";
import "./card-editor";
import "./schedule-editor-dialog";
import type { SchedulerPlusScheduleEditor } from "./schedule-editor-dialog";
import type { Schedule } from "./types";
import { DEVICE_TYPE_LABELS } from "./types";

/**
 * Formats a schedule's server-computed next event as e.g. "Next: On Fri, 6:00 AM".
 * `next_event`/`next_event_action` come straight from list_schedules (see
 * websocket.py) rather than being looked up from a separate sensor entity -
 * one less thing that can be missing/renamed/disabled out from under the card.
 */
function formatNextEvent(schedule: Schedule): string | undefined {
  if (!schedule.next_event) {
    return undefined;
  }
  const when = new Date(schedule.next_event);
  if (Number.isNaN(when.getTime())) {
    return undefined;
  }
  const action = schedule.next_event_action === "off" ? "Off" : "On";
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
  /** Only show schedules targeting at least one of these entities. Empty/unset shows all. */
  entities?: string[];
}

/**
 * Scheduler+'s brand color: fixed rather than tied to `--primary-color`,
 * since the badge is the one consistent piece of the mark's identity across
 * every Home Assistant theme it might render on - see the "Switch Mark"
 * concept (two rocker switches, opposite states) chosen for the card icon.
 */
const BRAND_ACCENT = "#F2A93B";

@customElement("scheduler-plus-card")
export class SchedulerPlusCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config?: SchedulerPlusCardConfig;

  @state() private _schedules: Schedule[] = [];

  @state() private _loading = true;

  @state() private _error?: string;

  /** Schedule ids with an in-flight quick-toggle, so only that row's switch disables. */
  @state() private _pendingToggle = new Set<string>();

  @query("scheduler-plus-schedule-editor")
  private _editor?: SchedulerPlusScheduleEditor;

  static getStubConfig(): SchedulerPlusCardConfig {
    return { type: "custom:scheduler-plus-card" };
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("scheduler-plus-card-editor");
  }

  setConfig(config: SchedulerPlusCardConfig): void {
    this._config = config;
  }

  getCardSize(): number {
    return 2 + this._visibleSchedules.length;
  }

  /**
   * Schedules to actually display: all of them, unless this card instance
   * is configured with a device filter (`entities`), in which case only
   * schedules targeting at least one of those devices show up - lets a
   * dashboard page carry its own card instance scoped to just its devices.
   */
  private get _visibleSchedules(): Schedule[] {
    const filter = this._config?.entities;
    if (!filter || filter.length === 0) {
      return this._schedules;
    }
    return this._schedules.filter((schedule) =>
      schedule.entities.some((entityId) => filter.includes(entityId)),
    );
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
   * Flips a schedule's enabled state without opening the edit dialog.
   * update_schedule replaces the whole schedule, so every other field is
   * sent back unchanged - only `enabled` differs from what's already saved.
   */
  private _toggleScheduleEnabled = async (schedule: Schedule): Promise<void> => {
    this._pendingToggle = new Set(this._pendingToggle).add(schedule.id);
    try {
      await updateSchedule(this.hass, schedule.id, {
        name: schedule.name,
        device_type: schedule.device_type,
        entities: schedule.entities,
        enabled: !schedule.enabled,
        rules: schedule.rules,
      });
      await this._refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      const next = new Set(this._pendingToggle);
      next.delete(schedule.id);
      this._pendingToggle = next;
    }
  };

  private _openAddDialog = (): void => {
    this._editor?.showDialog();
  };

  private _openEditDialog = (schedule: Schedule): void => {
    this._editor?.showDialog(schedule);
  };

  protected override render() {
    return html`
      <ha-card>
        <div class="header">
          ${this._renderBrandMark()}
          <span>${this._config?.title ?? "Scheduler+"}</span>
        </div>
        <div class="content">${this._renderContent()}</div>
        <div class="card-actions">
          <button type="button" class="btn btn-primary" @click=${this._openAddDialog}>
            Add schedule
          </button>
        </div>
      </ha-card>
      <scheduler-plus-schedule-editor
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-schedule-editor>
    `;
  }

  /**
   * Two rocker switches in opposite states, badged with a plus - Scheduler+'s
   * mark. Line color follows `--primary-text-color` and fills follow
   * `--card-background-color` so it reads correctly on any HA theme; only
   * the badge keeps the fixed BRAND_ACCENT.
   */
  private _renderBrandMark() {
    return html`
      <svg class="brand-mark" viewBox="0 0 60 60" aria-hidden="true">
        <rect
          x="9"
          y="13"
          width="34"
          height="14"
          rx="7"
          fill="var(--card-background-color)"
          stroke="var(--primary-text-color)"
          stroke-width="4"
        />
        <circle cx="37" cy="20" r="8.5" fill="var(--primary-text-color)" />
        <rect
          x="9"
          y="31"
          width="34"
          height="14"
          rx="7"
          fill="var(--card-background-color)"
          stroke="var(--primary-text-color)"
          stroke-width="4"
        />
        <circle cx="15" cy="38" r="8.5" fill="var(--primary-text-color)" />
        <circle
          cx="47"
          cy="47"
          r="12"
          fill=${BRAND_ACCENT}
          stroke="var(--card-background-color)"
          stroke-width="3.5"
        />
        <line
          x1="41"
          y1="47"
          x2="53"
          y2="47"
          stroke="var(--card-background-color)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <line
          x1="47"
          y1="41"
          x2="47"
          y2="53"
          stroke="var(--card-background-color)"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  private _renderContent() {
    if (this._loading) {
      return html`<div class="placeholder">Loading schedules…</div>`;
    }
    if (this._error) {
      return html`<div class="placeholder error">${this._error}</div>`;
    }
    const visible = this._visibleSchedules;
    if (visible.length === 0) {
      const message =
        this._schedules.length === 0
          ? "No schedules yet."
          : "No schedules for this card's selected devices.";
      return html`<div class="placeholder">${message}</div>`;
    }
    return html`
      <ul class="schedules">
        ${visible.map((schedule) => this._renderSchedule(schedule))}
      </ul>
    `;
  }

  private _renderSchedule(schedule: Schedule) {
    const nextEvent = schedule.enabled ? formatNextEvent(schedule) : undefined;
    return html`
      <li class="schedule ${schedule.enabled ? "" : "disabled"}">
        <ha-switch
          .checked=${schedule.enabled}
          ?disabled=${this._pendingToggle.has(schedule.id)}
          @change=${() => this._toggleScheduleEnabled(schedule)}
        ></ha-switch>
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
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 0;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      flex: none;
    }
    .header span {
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ha-card-header-color, var(--primary-text-color));
    }
    .content {
      padding: 0 16px 16px;
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
    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-primary:hover {
      filter: brightness(0.95);
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
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .schedule ha-switch {
      flex: none;
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
      flex: 1;
      min-width: 0;
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
