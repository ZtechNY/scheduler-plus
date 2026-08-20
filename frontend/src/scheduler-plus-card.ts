import {
  mdiAccountClock,
  mdiCalendarClock,
  mdiCalendarPlus,
  mdiContentCopy,
  mdiDelete,
  mdiPauseCircleOutline,
  mdiPencil,
  mdiPlayCircleOutline,
  mdiViewGridPlusOutline,
} from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { HomeAssistant, ScheduleTemplate } from "./api";
import { deleteSchedule, fetchSchedules, toScheduleInput, updateSchedule } from "./api";
import "./apply-template-dialog";
import type { SchedulerPlusApplyTemplateDialog } from "./apply-template-dialog";
import "./card-editor";
import "./day-view-dialog";
import type { SchedulerPlusDayView } from "./day-view-dialog";
import { formatAction } from "./format-action";
import "./override-dialog";
import type { SchedulerPlusOverrideDialog } from "./override-dialog";
import "./preferences-dialog";
import type { SchedulerPlusPreferences } from "./preferences-dialog";
import "./quick-event-dialog";
import type { SchedulerPlusQuickEventDialog } from "./quick-event-dialog";
import "./schedule-editor-dialog";
import type { SchedulerPlusScheduleEditor } from "./schedule-editor-dialog";
import type { Schedule } from "./types";
import { DEVICE_TYPE_LABELS } from "./types";

/** Local "YYYY-MM-DD" for today, for comparing against override_until (also a plain date string). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Whether `schedule` is currently paused (override_until is set and not yet past). */
function isPaused(schedule: Schedule): boolean {
  return !!schedule.override_until && schedule.override_until >= todayIso();
}

/**
 * For a climate schedule, what turning "on" actually does - e.g. "Heat · 70°" -
 * so formatNextEvent can show more than a bare "On". Only returned when every
 * enabled, on-acting rule agrees on the same description: a schedule with a
 * 70° weekday rule and a 65° weekend rule has no single answer, and showing
 * just one would be misleading, so callers fall back to the plain "On" then.
 */
function climateOnDescription(schedule: Schedule): string | undefined {
  if (schedule.device_type !== "climate") {
    return undefined;
  }
  const descriptions = new Set(
    schedule.rules
      .filter((rule) => rule.enabled && rule.on_enabled)
      .map((rule) => formatAction("climate", rule.action))
      .filter((description): description is string => description !== undefined),
  );
  return descriptions.size === 1 ? [...descriptions][0] : undefined;
}

/**
 * For a climate schedule, what the "off" side actually does when every
 * enabled, off-acting rule has an eco setback configured (Rule.off_action)
 * - e.g. "Heat · 78°" in place of a bare "Off". If even one such rule
 * still does a plain turn-off, "Off" is left as the (accurate-enough)
 * fallback rather than guessing which rule fires next - same ambiguity
 * rule as climateOnDescription.
 */
function climateOffDescription(schedule: Schedule): string | undefined {
  if (schedule.device_type !== "climate") {
    return undefined;
  }
  const offRules = schedule.rules.filter((rule) => rule.enabled && rule.off_enabled);
  if (offRules.length === 0 || offRules.some((rule) => !rule.off_action)) {
    return undefined;
  }
  const descriptions = new Set(
    offRules
      .map((rule) => formatAction("climate", rule.off_action as Record<string, unknown>))
      .filter((description): description is string => description !== undefined),
  );
  return descriptions.size === 1 ? [...descriptions][0] : undefined;
}

/**
 * Formats a schedule's server-computed next event as e.g. "Next: On Fri, 6:00 AM"
 * - or, for a climate schedule with an unambiguous setpoint, "Next: Heat · 70°
 * Fri, 6:00 AM". The "off" side gets the same treatment when every acting
 * rule has an eco setback configured, e.g. "Next: Heat · 78° Fri, 9:00 PM"
 * instead of a bare "Off" - see climateOnDescription/climateOffDescription.
 * `next_event`/`next_event_action` come straight from list_schedules (see
 * websocket.py) rather than being looked up from a separate sensor entity -
 * one less thing that can be missing/renamed/disabled out from under the
 * card.
 */
function formatNextEvent(schedule: Schedule): string | undefined {
  if (!schedule.next_event) {
    return undefined;
  }
  const when = new Date(schedule.next_event);
  if (Number.isNaN(when.getTime())) {
    return undefined;
  }
  const action =
    schedule.next_event_action === "off"
      ? (climateOffDescription(schedule) ?? "Off")
      : (climateOnDescription(schedule) ?? "On");
  const formatted = when.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Next: ${action} ${formatted}`;
}

/**
 * Formats a schedule's seasonal-window status as e.g. "Inactive until Jul 1",
 * when its active_date_ranges currently exclude today (see
 * Schedule.is_active_on/websocket_list_schedules for how active_now/
 * next_active_date are computed server-side). Undefined when the schedule
 * is active right now, so this only ever adds a badge for the exception.
 */
function formatSeasonalStatus(schedule: Schedule): string | undefined {
  if (schedule.active_now) {
    return undefined;
  }
  if (!schedule.next_active_date) {
    return "Inactive (outside its active dates)";
  }
  const when = new Date(`${schedule.next_active_date}T00:00:00`);
  if (Number.isNaN(when.getTime())) {
    return "Inactive (outside its active dates)";
  }
  const formatted = when.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Inactive until ${formatted}`;
}

/**
 * Formats a schedule's pending-override status as e.g. "Manual change -
 * reverting Thu 8:14 PM", when one of its entities was changed by hand
 * during a not-allow_override rule's on-window and is still awaiting
 * reversion. `override_pending_until` mirrors the engine's in-memory
 * enforcement state (see SchedulerEngine.pending_override_revert_at /
 * websocket_list_schedules) - undefined otherwise, so this only ever adds
 * a badge for the exception, and there's nothing to poll: the next
 * _refresh (e.g. after any card action) picks up the cleared state once
 * the engine reapplies or the window ends.
 */
function formatOverridePendingStatus(schedule: Schedule): string | undefined {
  if (!schedule.override_pending_until) {
    return undefined;
  }
  const when = new Date(schedule.override_pending_until);
  const target = schedule.device_type === "climate"
    ? (() => {
        const descriptions = new Set(
          schedule.rules
            .filter((rule) => rule.enabled && rule.on_enabled && !rule.allow_override)
            .map((rule) => formatAction("climate", rule.action))
            .filter((description): description is string => !!description),
        );
        return descriptions.size === 1 ? ` to ${[...descriptions][0]}` : " to the scheduled setting";
      })()
    : " to the scheduled setting";
  if (Number.isNaN(when.getTime())) {
    return `Manual change${target} - reverting soon`;
  }
  const formatted = when.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Manual change${target} - reverting ${formatted}`;
}

/** Formats a paused schedule's status as e.g. "Paused through Jul 29". */
function formatPauseStatus(schedule: Schedule): string | undefined {
  if (!isPaused(schedule) || !schedule.override_until) {
    return undefined;
  }
  const when = new Date(`${schedule.override_until}T00:00:00`);
  if (Number.isNaN(when.getTime())) {
    return "Paused";
  }
  const formatted = when.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `Paused through ${formatted}`;
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

  @query("scheduler-plus-day-view")
  private _dayView?: SchedulerPlusDayView;

  @query("scheduler-plus-preferences")
  private _preferences?: SchedulerPlusPreferences;

  @query("scheduler-plus-override-dialog")
  private _overrideDialog?: SchedulerPlusOverrideDialog;

  @query("scheduler-plus-quick-event-dialog")
  private _quickEventDialog?: SchedulerPlusQuickEventDialog;

  @query("scheduler-plus-apply-template-dialog")
  private _applyTemplateDialog?: SchedulerPlusApplyTemplateDialog;

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
        ...toScheduleInput(schedule),
        enabled: !schedule.enabled,
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

  private _openDuplicateDialog = (schedule: Schedule): void => {
    this._editor?.showDialogDuplicate(schedule);
  };

  private _openPauseDialog = (schedule: Schedule): void => {
    this._overrideDialog?.showDialog(schedule);
  };

  /** Clears an active pause immediately - no dialog needed, there's no input to collect. */
  private _resumeNow = async (schedule: Schedule): Promise<void> => {
    this._pendingToggle = new Set(this._pendingToggle).add(schedule.id);
    try {
      await updateSchedule(this.hass, schedule.id, {
        ...toScheduleInput(schedule),
        override_until: null,
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

  private _openDayView = (): void => {
    this._dayView?.showDialog();
  };

  private _openPreferences = (): void => {
    this._preferences?.showDialog();
  };

  private _openQuickEvent = (): void => {
    this._quickEventDialog?.showDialog();
  };

  private _openApplyTemplate = (): void => {
    this._applyTemplateDialog?.showDialog();
  };

  /** Opens the full schedule editor pre-filled from a picked template, rather than
   *  creating the schedule sight-unseen - see apply-template-dialog.ts. */
  private _handleUseTemplate = (e: CustomEvent<{ template: ScheduleTemplate }>): void => {
    this._editor?.showDialogFromTemplate(e.detail.template);
  };

  protected override render() {
    return html`
      <ha-card>
        <div class="header">
          ${this._renderBrandMark()}
          <span>${this._config?.title ?? "Scheduler+"}</span>
          <ha-icon-button
            .path=${mdiAccountClock}
            label="My preferences"
            @click=${this._openPreferences}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiCalendarClock}
            label="Day view"
            @click=${this._openDayView}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiCalendarPlus}
            label="Quick event"
            @click=${this._openQuickEvent}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiViewGridPlusOutline}
            label="From template"
            @click=${this._openApplyTemplate}
          ></ha-icon-button>
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
      <scheduler-plus-day-view
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
      ></scheduler-plus-day-view>
      <scheduler-plus-preferences .hass=${this.hass}></scheduler-plus-preferences>
      <scheduler-plus-override-dialog
        .hass=${this.hass}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-override-dialog>
      <scheduler-plus-quick-event-dialog
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-quick-event-dialog>
      <scheduler-plus-apply-template-dialog
        .hass=${this.hass}
        @scheduler-plus-use-template=${this._handleUseTemplate}
      ></scheduler-plus-apply-template-dialog>
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
    const paused = isPaused(schedule);
    const nextEvent = schedule.enabled && !paused ? formatNextEvent(schedule) : undefined;
    const pauseStatus = schedule.enabled ? formatPauseStatus(schedule) : undefined;
    // Pause status takes priority over the seasonal badge when both apply -
    // the manager-triggered pause is the more actionable/urgent of the two.
    const seasonalStatus =
      schedule.enabled && !paused ? formatSeasonalStatus(schedule) : undefined;
    // Shown ahead of every other badge when present - a device not doing
    // what its schedule says right now is the most actionable state a row
    // can be in. In practice this shouldn't coexist with `paused` (pausing
    // tears down enforcement on the next refresh), but that's not asserted
    // here, so a stale/unexpected combination still surfaces rather than
    // being silently hidden.
    const overridePendingStatus = schedule.enabled
      ? formatOverridePendingStatus(schedule)
      : undefined;
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
          ${overridePendingStatus
            ? html`<span class="schedule-override-pending">${overridePendingStatus}</span>`
            : nothing}
          ${pauseStatus ? html`<span class="schedule-paused">${pauseStatus}</span>` : nothing}
          ${seasonalStatus
            ? html`<span class="schedule-seasonal">${seasonalStatus}</span>`
            : nothing}
          ${nextEvent ? html`<span class="schedule-next">${nextEvent}</span>` : nothing}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${mdiPencil}
            label="Edit"
            @click=${() => this._openEditDialog(schedule)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiContentCopy}
            label="Duplicate"
            @click=${() => this._openDuplicateDialog(schedule)}
          ></ha-icon-button>
          ${paused
            ? html`<ha-icon-button
                .path=${mdiPlayCircleOutline}
                label="Resume now"
                ?disabled=${this._pendingToggle.has(schedule.id)}
                @click=${() => this._resumeNow(schedule)}
              ></ha-icon-button>`
            : html`<ha-icon-button
                .path=${mdiPauseCircleOutline}
                label="Pause"
                @click=${() => this._openPauseDialog(schedule)}
              ></ha-icon-button>`}
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
      flex: 1;
      min-width: 0;
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ha-card-header-color, var(--primary-text-color));
    }
    .header ha-icon-button {
      flex: none;
    }
    .header ha-icon-button:last-child {
      margin-right: -8px;
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
    .schedule-seasonal {
      font-size: 0.85em;
      color: var(--warning-color, #ffa600);
    }
    .schedule-paused {
      font-size: 0.85em;
      color: var(--error-color, #db4437);
    }
    .schedule-override-pending {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--warning-color, #ffa600);
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
