import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, Preferences, RuleInput } from "./api";
import { fetchPreferences } from "./api";
import type {
  Action,
  DayConditionType,
  DeviceType,
  RuleDateMode,
  TimeProviderType,
  TimeSpec,
  Weekday,
} from "./types";
import {
  DAY_CONDITION_LABELS,
  DAY_CONDITION_TYPES,
  RULE_DATE_MODE_LABELS,
  RULE_DATE_MODES,
  TIME_PROVIDER_LABELS,
  TIME_PROVIDER_TYPES,
  WEEKDAYS,
  WEEKDAY_LABELS,
} from "./types";

/**
 * Fixed local list of climate "on" HVAC modes a rule can select. "off" is
 * deliberately excluded - a rule's off_time already turns the entity off via
 * ClimateDeviceHandler.async_turn_off, so it's never a meaningful on-action.
 * Kept here rather than in types.ts since it's a UI concern only: the
 * backend's ClimateDeviceHandler forwards whatever string it's given
 * straight to climate.set_hvac_mode without validating it against this list.
 */
const CLIMATE_HVAC_MODES = ["heat", "cool", "heat_cool", "auto", "dry", "fan_only"] as const;
type ClimateHvacMode = (typeof CLIMATE_HVAC_MODES)[number];
const CLIMATE_HVAC_MODE_LABELS: Record<ClimateHvacMode, string> = {
  heat: "Heat",
  cool: "Cool",
  heat_cool: "Heat/Cool",
  auto: "Auto",
  dry: "Dry",
  fan_only: "Fan only",
};

/**
 * Fallback preferences used until fetchPreferences() resolves (or if it
 * fails) - matches the backend's own defaults in const.py, so the presets
 * work identically before the user has ever opened Scheduler+'s options
 * flow (Settings > Devices & Services > Scheduler+ > Configure).
 */
const DEFAULT_PREFERENCES: Preferences = {
  weekday_days: ["mon", "tue", "wed", "thu", "fri"],
  weekend_days: ["sat", "sun"],
  working_hours_start: "09:00",
  working_hours_end: "17:00",
};

/**
 * Dialog for adding or editing a single Rule (days/on-time/off-time/action)
 * within a schedule. Purely local state: unlike the schedule editor, a rule
 * has no independent websocket command of its own - create_schedule and
 * update_schedule always replace a schedule's entire rules array - so this
 * dialog hands its result back to the caller via an `onSave` callback
 * instead of round-tripping through the server itself.
 */
@customElement("scheduler-plus-rule-editor")
export class SchedulerPlusRuleEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _preferences: Preferences = DEFAULT_PREFERENCES;

  @state() private _deviceType: DeviceType = "light";

  @state() private _name = "";

  @state() private _enabled = true;

  @state() private _days: Weekday[] = [];

  @state() private _dateMode: RuleDateMode = "always";

  @state() private _dates: string[] = [];

  @state() private _newDate = "";

  @state() private _dayConditions: DayConditionType[] = [];

  @state() private _onTime: TimeSpec = { provider: "fixed", params: { time: "06:00" } };

  @state() private _offTime: TimeSpec = { provider: "fixed", params: { time: "21:00" } };

  @state() private _setBrightness = false;

  @state() private _brightnessPct = 100;

  @state() private _useTransition = false;

  @state() private _transitionSeconds = 0;

  @state() private _hvacMode: string = "heat";

  @state() private _useTargetTemperature = false;

  @state() private _targetTemperature = 70;

  @state() private _error?: string;

  private _rule?: RuleInput;

  private _onSave?: (rule: RuleInput) => void;

  public showDialog(options: {
    deviceType: DeviceType;
    rule?: RuleInput;
    onSave: (rule: RuleInput) => void;
  }): void {
    const { deviceType, rule, onSave } = options;
    this._deviceType = deviceType;
    this._rule = rule;
    this._onSave = onSave;
    void this._loadPreferences();

    this._name = rule?.name ?? "";
    this._enabled = rule?.enabled ?? true;
    this._days = rule ? [...rule.days] : [];
    this._dateMode = rule?.date_mode ?? "always";
    this._dates = rule ? [...rule.dates] : [];
    this._newDate = "";
    this._dayConditions = rule ? [...rule.day_conditions] : [];
    this._onTime = rule?.on_time ?? { provider: "fixed", params: { time: "06:00" } };
    this._offTime = rule?.off_time ?? { provider: "fixed", params: { time: "21:00" } };

    if (deviceType === "light") {
      this._setBrightness = rule?.action.brightness !== undefined;
      const brightness = (rule?.action.brightness as number | undefined) ?? 255;
      this._brightnessPct = Math.round((brightness / 255) * 100);
      this._useTransition = rule?.action.transition !== undefined;
      this._transitionSeconds = (rule?.action.transition as number | undefined) ?? 0;
    } else if (deviceType === "climate") {
      this._hvacMode = (rule?.action.hvac_mode as string | undefined) ?? "heat";
      this._useTargetTemperature = rule?.action.target_temperature !== undefined;
      this._targetTemperature = (rule?.action.target_temperature as number | undefined) ?? 70;
    }
    // Switches have no action-specific state to populate - Rule.action is
    // always {} for a switch rule.

    this._error = undefined;
    this._open = true;
  }

  private async _loadPreferences(): Promise<void> {
    try {
      this._preferences = await fetchPreferences(this.hass);
    } catch {
      // Keep DEFAULT_PREFERENCES - the presets still work, just with the
      // hardcoded Mon-Fri/Sat-Sun/9-5 split instead of the user's own.
    }
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _toggleDay = (day: Weekday): void => {
    this._days = this._days.includes(day)
      ? this._days.filter((d) => d !== day)
      : [...this._days, day];
  };

  private _applyDayPreset = (days: readonly Weekday[]): void => {
    this._days = [...days];
  };

  /**
   * "After hours": every day, on at the end of the working day and off at
   * the start of the next one - the common porch-light/security use case.
   */
  private _applyAfterHoursPreset = (): void => {
    this._days = [...WEEKDAYS];
    this._onTime = {
      provider: "fixed",
      // Selector.TimeSelector values include seconds ("17:00:00"); the
      // fixed time provider only accepts "HH:MM".
      params: { time: this._preferences.working_hours_end.slice(0, 5) },
    };
    this._offTime = {
      provider: "fixed",
      params: { time: this._preferences.working_hours_start.slice(0, 5) },
    };
  };

  private _handleDateModeChange = (e: Event): void => {
    const mode = (e.target as HTMLSelectElement).value as RuleDateMode;
    this._dateMode = mode;
    if (mode === "include") {
      // Ignored by the engine in "include" mode, but the schema still
      // requires at least one day - fill it in rather than nagging the
      // user about a field this mode doesn't use.
      this._days = [...WEEKDAYS];
    }
  };

  private _addDate = (): void => {
    if (!this._newDate || this._dates.includes(this._newDate)) {
      return;
    }
    this._dates = [...this._dates, this._newDate].sort();
    this._newDate = "";
  };

  private _removeDate = (dateToRemove: string): void => {
    this._dates = this._dates.filter((d) => d !== dateToRemove);
  };

  private _toggleDayCondition = (condition: DayConditionType): void => {
    this._dayConditions = this._dayConditions.includes(condition)
      ? this._dayConditions.filter((c) => c !== condition)
      : [...this._dayConditions, condition];
  };

  private _save = (): void => {
    const name = this._name.trim();
    if (!name) {
      this._error = "Name is required.";
      return;
    }
    if (this._dateMode !== "include" && this._days.length === 0) {
      this._error = "At least one day is required.";
      return;
    }
    if (
      this._dateMode !== "always" &&
      this._dates.length === 0 &&
      this._dayConditions.length === 0
    ) {
      this._error = "At least one date or day condition is required.";
      return;
    }

    let action: Action = {};
    if (this._deviceType === "light") {
      action = {
        ...(this._setBrightness
          ? { brightness: Math.round((this._brightnessPct / 100) * 255) }
          : {}),
        ...(this._useTransition ? { transition: this._transitionSeconds } : {}),
      };
    } else if (this._deviceType === "climate") {
      action = {
        hvac_mode: this._hvacMode,
        ...(this._useTargetTemperature ? { target_temperature: this._targetTemperature } : {}),
      };
    }
    // Switches have no action - action stays {}.

    this._onSave?.({
      id: this._rule?.id,
      name,
      enabled: this._enabled,
      days: this._days,
      date_mode: this._dateMode,
      dates: this._dates,
      day_conditions: this._dayConditions,
      on_time: this._onTime,
      off_time: this._offTime,
      action,
    });
    this._open = false;
  };

  protected override render() {
    if (!this._open) {
      return nothing;
    }
    return html`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule ? "Edit rule" : "Add rule"}</div>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <label class="field-label" for="rule-name">Name</label>
          <input
            id="rule-name"
            type="text"
            class="native-input"
            .value=${this._name}
            @input=${(e: Event) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
          />

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${(e: Event) => {
                this._enabled = (e.target as HTMLInputElement).checked;
              }}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Days</label>
          <div class="day-presets">
            <button type="button" class="btn" @click=${() => this._applyDayPreset(WEEKDAYS)}>
              Every day
            </button>
            <button
              type="button"
              class="btn"
              @click=${() => this._applyDayPreset(this._preferences.weekday_days)}
            >
              Weekdays
            </button>
            <button
              type="button"
              class="btn"
              @click=${() => this._applyDayPreset(this._preferences.weekend_days)}
            >
              Weekend
            </button>
            <button type="button" class="btn" @click=${this._applyAfterHoursPreset}>
              After hours
            </button>
          </div>
          <div class="days">
            ${WEEKDAYS.map(
              (day) => html`
                <button
                  type="button"
                  class="day-chip ${this._days.includes(day) ? "active" : ""}"
                  ?disabled=${this._dateMode === "include"}
                  @click=${() => this._toggleDay(day)}
                >
                  ${WEEKDAY_LABELS[day].slice(0, 3)}
                </button>
              `,
            )}
          </div>

          <label class="field-label" for="date-mode">Date filter</label>
          <select
            id="date-mode"
            class="native-select"
            .value=${this._dateMode}
            @change=${this._handleDateModeChange}
          >
            ${RULE_DATE_MODES.map(
              (mode) => html`<option value=${mode}>${RULE_DATE_MODE_LABELS[mode]}</option>`,
            )}
          </select>
          ${this._dateMode !== "always"
            ? html`
                <span class="hint">
                  ${this._dateMode === "include"
                    ? "This rule only runs on the dates below, regardless of the Days selection."
                    : "This rule follows the Days selection above, except on the dates below - use this to override a recurring rule for one date."}
                </span>
                <div class="dates">
                  ${this._dates.map(
                    (dateValue) => html`
                      <div class="date-row">
                        <span>${dateValue}</span>
                        <button
                          type="button"
                          class="btn"
                          @click=${() => this._removeDate(dateValue)}
                        >
                          Remove
                        </button>
                      </div>
                    `,
                  )}
                  <div class="date-row">
                    <input
                      type="date"
                      class="native-input"
                      .value=${this._newDate}
                      @input=${(e: Event) => {
                        this._newDate = (e.target as HTMLInputElement).value;
                      }}
                    />
                    <button type="button" class="btn" @click=${this._addDate}>
                      Add date
                    </button>
                  </div>
                </div>

                <label class="field-label">Day conditions (YidCal)</label>
                <div class="days">
                  ${DAY_CONDITION_TYPES.map(
                    (condition) => html`
                      <button
                        type="button"
                        class="day-chip ${this._dayConditions.includes(condition)
                          ? "active"
                          : ""}"
                        @click=${() => this._toggleDayCondition(condition)}
                      >
                        ${DAY_CONDITION_LABELS[condition]}
                      </button>
                    `,
                  )}
                </div>
                <span class="hint">
                  Reflects YidCal's current state, so this can only be
                  confirmed for today - a future Shabbos/Yom Tov won't show
                  up in "Next event" ahead of time, but the rule still
                  applies correctly once that day arrives.
                </span>
              `
            : nothing}

          ${this._renderTimeFields(
            "On time",
            this._onTime,
            (spec) => (this._onTime = spec),
          )}
          ${this._renderTimeFields(
            "Off time",
            this._offTime,
            (spec) => (this._offTime = spec),
          )}

          ${this._renderActionFields()}

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button type="button" class="btn btn-primary" @click=${this._save}>Save</button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  private _renderTimeFields(
    label: string,
    spec: TimeSpec,
    onChange: (spec: TimeSpec) => void,
  ) {
    return html`
      <label class="field-label">${label}</label>
      <div class="time-row">
        <select
          class="native-select"
          .value=${spec.provider}
          @change=${(e: Event) => {
            const provider = (e.target as HTMLSelectElement).value as TimeProviderType;
            onChange({
              provider,
              params: provider === "fixed" ? { time: "06:00" } : { offset_minutes: 0 },
            });
          }}
        >
          ${TIME_PROVIDER_TYPES.map(
            (type) => html`<option value=${type}>${TIME_PROVIDER_LABELS[type]}</option>`,
          )}
        </select>
        ${spec.provider === "fixed"
          ? html`
              <input
                type="time"
                class="native-input"
                .value=${(spec.params.time as string | undefined) ?? ""}
                @input=${(e: Event) =>
                  onChange({
                    ...spec,
                    params: { time: (e.target as HTMLInputElement).value },
                  })}
              />
            `
          : html`
              <input
                type="number"
                class="native-input offset"
                .value=${String(spec.params.offset_minutes ?? 0)}
                @input=${(e: Event) =>
                  onChange({
                    ...spec,
                    params: {
                      offset_minutes: Number((e.target as HTMLInputElement).value) || 0,
                    },
                  })}
              />
              <span class="hint">minutes</span>
            `}
      </div>
    `;
  }

  private _renderActionFields() {
    if (this._deviceType === "light") {
      return this._renderLightAction();
    }
    if (this._deviceType === "climate") {
      return this._renderClimateAction();
    }
    return html`
      <span class="hint">Switches just turn on and off - nothing else to configure.</span>
    `;
  }

  private _renderLightAction() {
    return html`
      <ha-formfield label="Set brightness">
        <ha-switch
          .checked=${this._setBrightness}
          @change=${(e: Event) => {
            this._setBrightness = (e.target as HTMLInputElement).checked;
          }}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        Off by default - the light just turns on at whatever brightness it
        was last set to.
      </span>
      ${this._setBrightness
        ? html`
            <label class="field-label">Brightness (${this._brightnessPct}%)</label>
            <input
              type="range"
              min="1"
              max="100"
              class="native-input"
              .value=${String(this._brightnessPct)}
              @input=${(e: Event) => {
                this._brightnessPct = Number((e.target as HTMLInputElement).value);
              }}
            />
          `
        : nothing}

      <ha-formfield label="Fade in gradually">
        <ha-switch
          .checked=${this._useTransition}
          @change=${(e: Event) => {
            this._useTransition = (e.target as HTMLInputElement).checked;
          }}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        Instead of snapping on instantly, the light ramps up to its target
        level over the given number of seconds.
      </span>
      ${this._useTransition
        ? html`
            <label class="field-label" for="fade-duration">Fade duration (seconds)</label>
            <input
              id="fade-duration"
              type="number"
              class="native-input"
              .value=${String(this._transitionSeconds)}
              @input=${(e: Event) => {
                this._transitionSeconds =
                  Number((e.target as HTMLInputElement).value) || 0;
              }}
            />
          `
        : nothing}
    `;
  }

  private _renderClimateAction() {
    return html`
      <label class="field-label" for="hvac-mode">HVAC mode</label>
      <select
        id="hvac-mode"
        class="native-select"
        .value=${this._hvacMode}
        @change=${(e: Event) => {
          this._hvacMode = (e.target as HTMLSelectElement).value;
        }}
      >
        ${CLIMATE_HVAC_MODES.map(
          (mode) => html`<option value=${mode}>${CLIMATE_HVAC_MODE_LABELS[mode]}</option>`,
        )}
      </select>

      <ha-formfield label="Set target temperature">
        <ha-switch
          .checked=${this._useTargetTemperature}
          @change=${(e: Event) => {
            this._useTargetTemperature = (e.target as HTMLInputElement).checked;
          }}
        ></ha-switch>
      </ha-formfield>
      ${this._useTargetTemperature
        ? html`
            <label class="field-label" for="target-temperature">Target temperature</label>
            <input
              id="target-temperature"
              type="number"
              class="native-input"
              .value=${String(this._targetTemperature)}
              @input=${(e: Event) => {
                this._targetTemperature =
                  Number((e.target as HTMLInputElement).value) || 0;
              }}
            />
          `
        : nothing}
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
    .day-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .day-presets .btn {
      padding: 6px 12px;
      font-size: 13px;
    }
    .native-input.offset {
      width: 80px;
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
    .day-chip:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .dates {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .date-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-row span {
      flex: 1;
    }
    .time-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-rule-editor": SchedulerPlusRuleEditor;
  }
}
