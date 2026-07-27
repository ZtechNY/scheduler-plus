import { mdiDelete, mdiPencil } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";

import type { HomeAssistant, RuleInput, ScheduleInput } from "./api";
import { createSchedule, updateSchedule } from "./api";
import "./rule-editor-dialog";
import type { SchedulerPlusRuleEditor } from "./rule-editor-dialog";
import type { DeviceType, Schedule, TimeSpec } from "./types";
import {
  DAY_CONDITION_LABELS,
  DEVICE_TYPES,
  DEVICE_TYPE_LABELS,
  TIME_PROVIDER_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
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

/** Renders a TimeSpec for the rules list, e.g. "6:00 AM" or "Sunset +25". */
function formatTimeSpec(spec: TimeSpec): string {
  if (spec.provider === "fixed") {
    return formatFixedTime((spec.params.time as string | undefined) ?? "00:00");
  }
  const offset = (spec.params.offset_minutes as number | undefined) ?? 0;
  if (offset === 0) {
    return TIME_PROVIDER_LABELS[spec.provider];
  }
  return `${TIME_PROVIDER_LABELS[spec.provider]} ${offset > 0 ? "+" : ""}${offset}`;
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

  @state() private _schedule?: Schedule;

  @state() private _open = false;

  @state() private _name = "";

  @state() private _deviceType: DeviceType = "light";

  @state() private _enabled = true;

  @state() private _entities: string[] = [];

  @state() private _rules: RuleInput[] = [];

  @state() private _saving = false;

  @state() private _error?: string;

  @query("scheduler-plus-rule-editor")
  private _ruleEditor?: SchedulerPlusRuleEditor;

  public showDialog(schedule?: Schedule): void {
    this._schedule = schedule;
    this._name = schedule?.name ?? "";
    this._deviceType = schedule?.device_type ?? "light";
    this._enabled = schedule?.enabled ?? true;
    this._entities = schedule ? [...schedule.entities] : [];
    this._rules = schedule ? schedule.rules.map((rule) => ({ ...rule })) : [];
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

  private _addEntity = (entityId: string | undefined): void => {
    if (!entityId || this._entities.includes(entityId)) {
      return;
    }
    this._entities = [...this._entities, entityId];
  };

  private _removeEntity = (index: number): void => {
    this._entities = this._entities.filter((_, i) => i !== index);
  };

  private _updateEntity = (index: number, entityId: string | undefined): void => {
    if (!entityId) {
      this._removeEntity(index);
      return;
    }
    this._entities = this._entities.map((existing, i) =>
      i === index ? entityId : existing,
    );
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

    this._saving = true;
    this._error = undefined;
    try {
      const input: ScheduleInput = {
        name,
        device_type: this._deviceType,
        entities: this._entities,
        enabled: this._enabled,
        rules: this._rules,
      };
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

          <label class="field-label">Entities</label>
          <div class="entities">
            ${repeat(
              this._entities,
              (entityId) => entityId,
              (entityId, index) => html`
                <div class="entity-row">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${entityId}
                    .includeDomains=${[this._deviceType]}
                    @value-changed=${(e: CustomEvent<{ value?: string }>) =>
                      this._updateEntity(index, e.detail.value)}
                  ></ha-entity-picker>
                  <ha-icon-button
                    .path=${mdiDelete}
                    label="Remove entity"
                    @click=${() => this._removeEntity(index)}
                  ></ha-icon-button>
                </div>
              `,
            )}
            ${keyed(
              this._entities.length,
              html`
                <ha-entity-picker
                  .hass=${this.hass}
                  .includeDomains=${[this._deviceType]}
                  @value-changed=${(e: CustomEvent<{ value?: string }>) =>
                    this._addEntity(e.detail.value)}
                ></ha-entity-picker>
              `,
            )}
          </div>

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

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Save
            </button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-rule-editor .hass=${this.hass}></scheduler-plus-rule-editor>
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
        <div class="rule-info">
          <span class="rule-name">${rule.name}</span>
          <span class="rule-meta">
            ${days} · ${formatTimeSpec(rule.on_time)} → ${formatTimeSpec(rule.off_time)}${dateNote}
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
    .entities {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .entity-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entity-row ha-entity-picker {
      flex: 1;
    }
    .rules-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
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
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
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
