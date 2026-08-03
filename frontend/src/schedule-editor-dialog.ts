import { mdiDelete, mdiPencil } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type {
  HomeAssistant,
  RuleInput,
  ScheduleConflict,
  ScheduleInput,
  ScheduleTemplate,
} from "./api";
import { checkScheduleConflicts, createSchedule, updateSchedule } from "./api";
import { describeConflict, excludeConflictDate } from "./conflict-utils";
import "./entity-multi-picker";
import "./rule-editor-dialog";
import type { SchedulerPlusRuleEditor } from "./rule-editor-dialog";
import "./template-editor-dialog";
import type { SchedulerPlusTemplateEditor } from "./template-editor-dialog";
import type { DeviceType, RuleDateMode, Schedule, TimeSpec, YidcalZmanType } from "./types";
import {
  DAY_CONDITION_LABELS,
  DEVICE_TYPES,
  DEVICE_TYPE_DOMAINS,
  DEVICE_TYPE_LABELS,
  RULE_DATE_MODES,
  TIME_PROVIDER_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
  YIDCAL_ZMAN_LABELS,
} from "./types";

/** Renders a fixed "HH:MM" as a 12-hour clock time, e.g. "06:00" -> "6:00 AM". */
function formatFixedTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

/** Renders a TimeSpec for the rules list, e.g. "6:00 AM", "Sunset +25", or "הדלקות הנירות". */
function formatTimeSpec(spec: TimeSpec): string {
  if (spec.provider === "fixed") {
    return formatFixedTime((spec.params.time as string | undefined) ?? "00:00");
  }
  const label =
    spec.provider === "yidcal"
      ? (YIDCAL_ZMAN_LABELS[spec.params.zman as YidcalZmanType] ?? TIME_PROVIDER_LABELS.yidcal)
      : TIME_PROVIDER_LABELS[spec.provider];
  const offset = (spec.params.offset_minutes as number | undefined) ?? 0;
  if (offset === 0) {
    return label;
  }
  return `${label} ${offset > 0 ? "+" : ""}${offset}`;
}

/** Renders a rule's on/off summary, accounting for on-only/off-only rules. */
function formatRuleTimes(rule: {
  on_time: TimeSpec;
  off_time: TimeSpec;
  on_enabled: boolean;
  off_enabled: boolean;
}): string {
  if (rule.on_enabled && rule.off_enabled) {
    return `${formatTimeSpec(rule.on_time)} → ${formatTimeSpec(rule.off_time)}`;
  }
  if (rule.on_enabled) {
    return `${formatTimeSpec(rule.on_time)} only`;
  }
  return `until ${formatTimeSpec(rule.off_time)}`;
}

/**
 * Dialog for creating or editing a schedule: its top-level fields (name,
 * device type, enabled, entities) plus its rules. Rules are edited via the
 * nested scheduler-plus-rule-editor dialog, but only ever committed to the
 * server as part of this dialog's own Save - update_schedule replaces the
 * whole schedule, so there is no separate per-rule websocket command.
 */
@customElement("scheduler-plus-schedule-editor")
export class SchedulerPlusScheduleEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  /**
   * The owning card's own device filter (SchedulerPlusCardConfig.entities),
   * if configured. When set, the Entities picker below only offers these
   * devices instead of every entity in the given domain - so a card scoped
   * to one dashboard page only ever lets you pick devices relevant to it.
   */
  @property({ attribute: false }) entityFilter?: string[];

  @state() private _schedule?: Schedule;

  @state() private _open = false;

  @state() private _name = "";

  @state() private _deviceType: DeviceType = "light_switch";

  @state() private _enabled = true;

  @state() private _entities: string[] = [];

  @state() private _rules: RuleInput[] = [];

  /** Seasonal active window - see Schedule.is_active_on's docstring in models.py. */
  @state() private _activeDateMode: RuleDateMode = "always";

  @state() private _activeDateRanges: [string, string][] = [];

  @state() private _newActiveRangeStart = "";

  @state() private _newActiveRangeEnd = "";

  @state() private _saving = false;

  @state() private _checkingConflicts = false;

  @state() private _conflicts: ScheduleConflict[] = [];

  @state() private _error?: string;

  @query("scheduler-plus-rule-editor")
  private _ruleEditor?: SchedulerPlusRuleEditor;

  @query("scheduler-plus-template-editor")
  private _templateEditor?: SchedulerPlusTemplateEditor;

  public showDialog(schedule?: Schedule): void {
    this._schedule = schedule;
    this._name = schedule?.name ?? "";
    this._deviceType = schedule?.device_type ?? "light_switch";
    this._enabled = schedule?.enabled ?? true;
    this._entities = schedule ? [...schedule.entities] : [];
    this._rules = schedule ? schedule.rules.map((rule) => ({ ...rule })) : [];
    this._activeDateMode = schedule?.active_date_mode ?? "always";
    this._activeDateRanges = schedule?.active_date_ranges ? [...schedule.active_date_ranges] : [];
    this._newActiveRangeStart = "";
    this._newActiveRangeEnd = "";
    this._conflicts = [];
    this._error = undefined;
    this._open = true;
  }

  /**
   * Opens the dialog pre-filled from an existing schedule, but as a new
   * schedule to be created rather than an update - `_schedule` stays
   * undefined so `_save()` calls createSchedule, and each cloned rule has
   * its `id` stripped so the backend assigns fresh ones (same path new
   * rules already take when a rule is added from scratch).
   */
  public showDialogDuplicate(schedule: Schedule): void {
    this._schedule = undefined;
    this._name = `Copy of ${schedule.name}`;
    this._deviceType = schedule.device_type;
    this._enabled = schedule.enabled;
    this._entities = [...schedule.entities];
    this._rules = schedule.rules.map((rule) => {
      const { id: _id, ...rest } = rule;
      return { ...rest };
    });
    this._activeDateMode = schedule.active_date_mode ?? "always";
    this._activeDateRanges = schedule.active_date_ranges ? [...schedule.active_date_ranges] : [];
    this._newActiveRangeStart = "";
    this._newActiveRangeEnd = "";
    this._conflicts = [];
    this._error = undefined;
    this._open = true;
  }

  /**
   * Opens the dialog pre-filled from a saved schedule template - like
   * showDialogDuplicate, this creates a new schedule rather than updating
   * one, but the source has no entities/enabled of its own (see
   * ScheduleTemplate in models.py), so those start blank/default rather
   * than copied. The manager still goes through the normal editor - add
   * entities, review/adjust rules, then Save - rather than the template
   * being applied sight-unseen.
   */
  public showDialogFromTemplate(template: ScheduleTemplate): void {
    this._schedule = undefined;
    this._name = template.name;
    this._deviceType = template.device_type;
    this._enabled = true;
    this._entities = [];
    this._rules = template.rules.map((rule) => {
      const { id: _id, ...rest } = rule;
      return { ...rest };
    });
    this._activeDateMode = "always";
    this._activeDateRanges = [];
    this._newActiveRangeStart = "";
    this._newActiveRangeEnd = "";
    this._conflicts = [];
    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _handleDeviceTypeChange = (event: Event): void => {
    this._deviceType = (event.target as HTMLSelectElement).value as DeviceType;
    // Entities picked for the previous device type would no longer match
    // this one's domain, and existing rules' actions (brightness/transition
    // vs hvac_mode/target_temperature) would no longer make sense either -
    // neither can carry over.
    this._entities = [];
    this._rules = [];
  };

  private _handleActiveDateModeChange = (event: Event): void => {
    this._activeDateMode = (event.target as HTMLSelectElement).value as RuleDateMode;
  };

  private _addActiveDateRange = (): void => {
    const start = this._newActiveRangeStart;
    const end = this._newActiveRangeEnd;
    if (!start || !end || start > end) {
      return;
    }
    if (!this._activeDateRanges.some(([s, e]) => s === start && e === end)) {
      this._activeDateRanges = [...this._activeDateRanges, [start, end]];
    }
    this._newActiveRangeStart = "";
    this._newActiveRangeEnd = "";
  };

  private _removeActiveDateRange = (index: number): void => {
    this._activeDateRanges = this._activeDateRanges.filter((_, i) => i !== index);
  };

  private _openSaveAsTemplate = (): void => {
    this._templateEditor?.showDialog(this._deviceType, this._rules, "schedule");
  };

  private _openAddRuleDialog = (): void => {
    this._ruleEditor?.showDialog({
      deviceType: this._deviceType,
      onSave: (rule) => {
        this._rules = [...this._rules, rule];
      },
    });
  };

  private _openEditRuleDialog = (index: number): void => {
    this._ruleEditor?.showDialog({
      deviceType: this._deviceType,
      rule: this._rules[index],
      onSave: (rule) => {
        this._rules = this._rules.map((existing, i) => (i === index ? rule : existing));
      },
    });
  };

  private _removeRule = (index: number): void => {
    const rule = this._rules[index];
    if (!rule || !window.confirm(`Delete rule "${rule.name}"?`)) {
      return;
    }
    this._rules = this._rules.filter((_, i) => i !== index);
  };

  /**
   * Flips a rule's enabled state in the local buffer without opening its
   * edit dialog - like every other rule edit here, this only takes effect
   * once the schedule itself is saved.
   */
  private _toggleRuleEnabled = (index: number): void => {
    this._rules = this._rules.map((r, i) =>
      i === index ? { ...r, enabled: !r.enabled } : r,
    );
  };

  private _buildInput(name: string): ScheduleInput {
    return {
      name,
      device_type: this._deviceType,
      entities: this._entities,
      enabled: this._enabled,
      rules: this._rules,
      active_date_mode: this._activeDateMode,
      active_date_ranges: this._activeDateRanges,
      // Not editable from this dialog (see override-dialog.ts) - carried
      // forward unchanged so editing a schedule's rules doesn't silently
      // clear an active pause.
      override_until: this._schedule?.override_until ?? null,
    };
  }

  private async _persist(input: ScheduleInput): Promise<void> {
    this._saving = true;
    this._error = undefined;
    try {
      if (this._schedule) {
        await updateSchedule(this.hass, this._schedule.id, input);
      } else {
        await createSchedule(this.hass, input);
      }
      this._open = false;
      this.dispatchEvent(new CustomEvent("schedule-plus-saved"));
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._saving = false;
    }
  }

  /**
   * Always re-checks for cross-schedule conflicts before saving - unlike
   * _saveAnyway (an explicit, one-time bypass a manager clicks only after
   * already seeing the warning), this button re-runs the check on every
   * click, so an edit made after conflicts were shown can't silently save
   * with a *different*, never-reviewed conflict.
   */
  private _save = async (): Promise<void> => {
    const name = this._name.trim();
    if (!name) {
      this._error = "Name is required.";
      return;
    }
    if (this._entities.length === 0) {
      this._error = "At least one entity is required.";
      return;
    }

    const input = this._buildInput(name);
    this._checkingConflicts = true;
    this._error = undefined;
    try {
      const conflicts = await checkScheduleConflicts(
        this.hass,
        this._schedule?.id ?? null,
        input,
      );
      if (conflicts.length === 0) {
        this._conflicts = [];
        await this._persist(input);
      } else {
        this._conflicts = conflicts;
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._checkingConflicts = false;
    }
  };

  /** Explicit bypass, only offered once conflicts are already shown - see _save. */
  private _saveAnyway = (): void => {
    const name = this._name.trim();
    void this._persist(this._buildInput(name));
  };

  private _excludeConflict = async (conflict: ScheduleConflict): Promise<void> => {
    try {
      await excludeConflictDate(this.hass, conflict);
      // Fixing this rule/date also resolves any other listed conflict
      // against the exact same conflicting rule and date, even if it was
      // reported against a different one of this schedule's own rules.
      this._conflicts = this._conflicts.filter(
        (c) =>
          !(
            c.conflicting_rule_id === conflict.conflicting_rule_id &&
            c.date === conflict.date
          ),
      );
      if (this._conflicts.length === 0) {
        await this._persist(this._buildInput(this._name.trim()));
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    }
  };

  protected override render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._schedule ? "Edit schedule" : "Add schedule"}
          </div>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <label class="field-label" for="schedule-name">Name</label>
          <input
            id="schedule-name"
            type="text"
            class="native-input"
            .value=${this._name}
            @input=${(e: Event) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
          />

          <label class="field-label" for="device-type">Device type</label>
          <select
            id="device-type"
            class="native-select"
            .value=${this._deviceType}
            ?disabled=${this._schedule !== undefined}
            @change=${this._handleDeviceTypeChange}
          >
            ${DEVICE_TYPES.map(
              (type) => html`<option value=${type}>${DEVICE_TYPE_LABELS[type]}</option>`,
            )}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${(e: Event) => {
                this._enabled = (e.target as HTMLInputElement).checked;
              }}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label" for="active-date-mode">Active period</label>
          <select
            id="active-date-mode"
            class="native-select"
            .value=${this._activeDateMode}
            @change=${this._handleActiveDateModeChange}
          >
            ${RULE_DATE_MODES.map(
              (mode) =>
                html`<option value=${mode}>
                  ${mode === "always"
                    ? "Always active"
                    : mode === "include"
                      ? "Only during these date ranges"
                      : "Except during these date ranges"}
                </option>`,
            )}
          </select>
          ${this._activeDateMode !== "always" ? this._renderActivePeriodPanel() : nothing}

          <label class="field-label">Entities</label>
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${DEVICE_TYPE_DOMAINS[this._deviceType]}
            .includeEntities=${this.entityFilter}
            @value-changed=${(e: CustomEvent<{ value: string[] }>) => {
              this._entities = e.detail.value;
            }}
          ></scheduler-plus-entity-multi-picker>

          <div class="rules-header">
            <label class="field-label">Rules</label>
            <button type="button" class="btn" @click=${this._openAddRuleDialog}>
              Add rule
            </button>
          </div>
          ${this._rules.length === 0
            ? html`<div class="placeholder">No rules yet.</div>`
            : html`
                <ul class="rules">
                  ${this._rules.map((rule, index) => this._renderRule(rule, index))}
                </ul>
              `}

          ${this._conflicts.length > 0 ? this._renderConflictPanel() : nothing}

          <div class="dialog-actions">
            <button
              type="button"
              class="btn"
              ?disabled=${this._saving || this._checkingConflicts}
              @click=${this._openSaveAsTemplate}
            >
              Save as template
            </button>
            <span class="spacer"></span>
            <button
              type="button"
              class="btn"
              ?disabled=${this._saving || this._checkingConflicts}
              @click=${this._closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving || this._checkingConflicts}
              @click=${this._save}
            >
              ${this._checkingConflicts ? "Checking…" : "Save"}
            </button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-rule-editor .hass=${this.hass}></scheduler-plus-rule-editor>
      <scheduler-plus-template-editor .hass=${this.hass}></scheduler-plus-template-editor>
    `;
  }

  private _renderConflictPanel() {
    return html`
      <div class="conflict-panel">
        <span class="conflict-title">
          This overlaps ${this._conflicts.length === 1 ? "another schedule" : "other schedules"}
        </span>
        <ul class="conflicts">
          ${this._conflicts.map(
            (conflict) => html`
              <li class="conflict-row">
                <div class="conflict-info">
                  <span>${describeConflict(conflict)}</span>
                  <span class="hint">${conflict.entity_ids.join(", ")}</span>
                </div>
                ${conflict.fixable
                  ? html`
                      <button
                        type="button"
                        class="btn"
                        @click=${() => this._excludeConflict(conflict)}
                      >
                        Exclude "${conflict.conflicting_schedule_name}" on ${conflict.date}
                      </button>
                    `
                  : html`<span class="hint">Adjust manually - can't auto-fix this one.</span>`}
              </li>
            `,
          )}
        </ul>
        <button type="button" class="btn" @click=${this._saveAnyway}>Save anyway</button>
      </div>
    `;
  }

  private _renderActivePeriodPanel() {
    return html`
      <div class="filter-panel">
        <span class="panel-label">Date ranges</span>
        ${this._activeDateRanges.length === 0
          ? html`<span class="hint">None added yet.</span>`
          : html`
              <ul class="dates">
                ${this._activeDateRanges.map(
                  ([start, end], index) => html`
                    <li class="date-row">
                      <span>${start} → ${end}</span>
                      <button
                        type="button"
                        class="btn"
                        @click=${() => this._removeActiveDateRange(index)}
                      >
                        Remove
                      </button>
                    </li>
                  `,
                )}
              </ul>
            `}
        <div class="range-add-row">
          <input
            type="date"
            class="native-input"
            .value=${this._newActiveRangeStart}
            @input=${(e: Event) => {
              this._newActiveRangeStart = (e.target as HTMLInputElement).value;
            }}
          />
          <span class="sep">to</span>
          <input
            type="date"
            class="native-input"
            .value=${this._newActiveRangeEnd}
            @input=${(e: Event) => {
              this._newActiveRangeEnd = (e.target as HTMLInputElement).value;
            }}
          />
          <button type="button" class="btn" @click=${this._addActiveDateRange}>
            Add range
          </button>
        </div>
      </div>
    `;
  }

  private _renderRule(rule: RuleInput, index: number) {
    const days = [...rule.days]
      .sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
      .map((day) => WEEKDAY_LABELS[day].slice(0, 3))
      .join(", ");
    const filterParts = [
      ...(rule.dates.length > 0
        ? [`${rule.dates.length} date${rule.dates.length === 1 ? "" : "s"}`]
        : []),
      ...(rule.date_ranges.length > 0
        ? [`${rule.date_ranges.length} range${rule.date_ranges.length === 1 ? "" : "s"}`]
        : []),
      ...rule.day_conditions.map((condition) => DAY_CONDITION_LABELS[condition]),
    ];
    const dateNote =
      filterParts.length === 0
        ? ""
        : rule.date_mode === "exclude"
          ? ` · except ${filterParts.join(", ")}`
          : rule.date_mode === "include"
            ? ` · only ${filterParts.join(", ")}`
            : "";
    return html`
      <li class="rule ${rule.enabled ? "" : "disabled"}">
        <ha-switch
          .checked=${rule.enabled}
          @change=${() => this._toggleRuleEnabled(index)}
        ></ha-switch>
        <div class="rule-info">
          <span class="rule-name">${rule.name}</span>
          <span class="rule-meta">
            ${days} · ${formatRuleTimes(rule)}${dateNote}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${mdiPencil}
            label="Edit rule"
            @click=${() => this._openEditRuleDialog(index)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${mdiDelete}
            label="Remove rule"
            @click=${() => this._removeRule(index)}
          ></ha-icon-button>
        </div>
      </li>
    `;
  }

  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .dialog-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
    .spacer {
      flex: 1;
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
    .error {
      color: var(--error-color);
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
    .rules-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
    }
    .conflict-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 6px;
    }
    .conflict-title {
      font-weight: 500;
      color: var(--warning-color, #ffa600);
    }
    ul.conflicts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color);
    }
    .conflict-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .conflict-info {
      display: flex;
      flex-direction: column;
      font-size: 0.9em;
    }
    .panel-label {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    ul.dates {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .date-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .range-add-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sep {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .placeholder {
      padding: 8px 0;
      color: var(--secondary-text-color);
    }
    ul.rules {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .rule {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .rule ha-switch {
      flex: none;
    }
    .rule:last-child {
      border-bottom: none;
    }
    .rule.disabled .rule-name {
      color: var(--disabled-text-color);
    }
    .rule-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .rule-name {
      font-weight: 500;
    }
    .rule-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .row-actions {
      display: flex;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-schedule-editor": SchedulerPlusScheduleEditor;
  }
}
