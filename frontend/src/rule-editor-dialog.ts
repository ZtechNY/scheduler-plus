import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

import type { HomeAssistant, Preferences, RuleInput } from "./api";
import { fetchPreferences } from "./api";
import "./rule-template-picker-dialog";
import type { SchedulerPlusRuleTemplatePicker } from "./rule-template-picker-dialog";
import "./template-editor-dialog";
import type { SchedulerPlusTemplateEditor } from "./template-editor-dialog";
import type { Action, DayConditionType, DeviceType, Rule, RuleDateMode, TimeSpec, Weekday } from "./types";
import {
  CLIMATE_HVAC_MODES,
  CLIMATE_HVAC_MODE_LABELS,
  DAY_CONDITION_LABELS,
  DAY_CONDITION_TYPES,
  RULE_DATE_MODE_LABELS,
  RULE_DATE_MODES,
  TIME_PROVIDER_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
  YIDCAL_ZMAN_LABELS,
  YIDCAL_ZMAN_TYPES,
} from "./types";

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
  enable_brightness: true,
  enable_fade_in: true,
};

/**
 * Flattened options for the On time/Off time dropdown: every YidCal zman
 * shows up as its own top-level entry (e.g. "הדלקות הנירות") rather than
 * behind a nested "YidCal" -> "which zman" pair of dropdowns. The backend
 * shape (TimeSpec.provider="yidcal", params.zman="candle_lighting") is
 * unchanged - this is purely how the choice is presented, so as more
 * zmanim are added later they each just become one more entry here.
 */
interface TimeOption {
  key: string;
  label: string;
  makeSpec: () => TimeSpec;
  matches: (spec: TimeSpec) => boolean;
}

const TIME_OPTIONS: readonly TimeOption[] = [
  {
    key: "fixed",
    label: TIME_PROVIDER_LABELS.fixed,
    makeSpec: () => ({ provider: "fixed", params: { time: "06:00" } }),
    matches: (spec) => spec.provider === "fixed",
  },
  {
    key: "sunrise",
    label: TIME_PROVIDER_LABELS.sunrise,
    makeSpec: () => ({ provider: "sunrise", params: { offset_minutes: 0 } }),
    matches: (spec) => spec.provider === "sunrise",
  },
  {
    key: "sunset",
    label: TIME_PROVIDER_LABELS.sunset,
    makeSpec: () => ({ provider: "sunset", params: { offset_minutes: 0 } }),
    matches: (spec) => spec.provider === "sunset",
  },
  ...YIDCAL_ZMAN_TYPES.map(
    (zman): TimeOption => ({
      key: `yidcal:${zman}`,
      label: YIDCAL_ZMAN_LABELS[zman],
      makeSpec: () => ({ provider: "yidcal", params: { zman, offset_minutes: 0 } }),
      matches: (spec) => spec.provider === "yidcal" && spec.params.zman === zman,
    }),
  ),
];

/** Renders a "YYYY-MM-DD" string as e.g. "Jul 26, 2026". */
function formatDate(iso: string): string {
  // Appending a local midnight time avoids new Date("YYYY-MM-DD") parsing
  // the string as UTC, which can display a day early in negative-UTC-offset
  // time zones.
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

  @state() private _dateRanges: [string, string][] = [];

  @state() private _newRangeStart = "";

  @state() private _newRangeEnd = "";

  @state() private _dayConditions: DayConditionType[] = [];

  @state() private _onTime: TimeSpec = { provider: "fixed", params: { time: "06:00" } };

  @state() private _offTime: TimeSpec = { provider: "fixed", params: { time: "21:00" } };

  @state() private _onEnabled = true;

  @state() private _offEnabled = true;

  @state() private _setBrightness = false;

  @state() private _brightnessPct = 100;

  @state() private _useTransition = false;

  @state() private _transitionSeconds = 0;

  @state() private _hvacMode: string = "heat";

  @state() private _useTargetTemperature = false;

  @state() private _targetTemperature = 70;

  @state() private _allowOverride = true;

  @state() private _overrideGraceMinutes = 15;

  @state() private _error?: string;

  private _rule?: RuleInput;

  private _onSave?: (rule: RuleInput) => void;

  @query("scheduler-plus-template-editor")
  private _templateEditor?: SchedulerPlusTemplateEditor;

  @query("scheduler-plus-rule-template-picker")
  private _templatePicker?: SchedulerPlusRuleTemplatePicker;

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
    this._hydrateFromRule(rule);
    this._error = undefined;
    this._open = true;
  }

  /**
   * Populates every field from `rule` (or defaults, if undefined) - shared
   * by showDialog (opening for add/edit) and _applyRuleTemplate (rewriting
   * the form in place once a template is picked mid-edit). Deliberately
   * does not touch `_rule`/`_onSave`: picking a template should replace
   * this rule's contents, not detach it from whichever existing rule it
   * was opened to edit (its id, and the onSave it'll be committed through,
   * must stay put).
   */
  private _hydrateFromRule(rule: RuleInput | undefined): void {
    this._name = rule?.name ?? "";
    this._enabled = rule?.enabled ?? true;
    this._days = rule ? [...rule.days] : [];
    this._dateMode = rule?.date_mode ?? "always";
    this._dates = rule ? [...rule.dates] : [];
    this._newDate = "";
    this._dateRanges = rule ? rule.date_ranges.map(([start, end]) => [start, end]) : [];
    this._newRangeStart = "";
    this._newRangeEnd = "";
    this._dayConditions = rule ? [...rule.day_conditions] : [];
    this._onTime = rule?.on_time ?? { provider: "fixed", params: { time: "06:00" } };
    this._offTime = rule?.off_time ?? { provider: "fixed", params: { time: "21:00" } };
    this._onEnabled = rule?.on_enabled ?? true;
    this._offEnabled = rule?.off_enabled ?? true;
    this._allowOverride = rule?.allow_override ?? true;
    this._overrideGraceMinutes = rule?.override_grace_minutes ?? 15;

    if (this._deviceType === "light" || this._deviceType === "light_switch") {
      this._setBrightness = rule?.action.brightness !== undefined;
      const brightness = (rule?.action.brightness as number | undefined) ?? 255;
      this._brightnessPct = Math.round((brightness / 255) * 100);
      this._useTransition = rule?.action.transition !== undefined;
      this._transitionSeconds = (rule?.action.transition as number | undefined) ?? 0;
    } else if (this._deviceType === "climate") {
      this._hvacMode = (rule?.action.hvac_mode as string | undefined) ?? "heat";
      this._useTargetTemperature = rule?.action.target_temperature !== undefined;
      this._targetTemperature = (rule?.action.target_temperature as number | undefined) ?? 70;
    }
    // Switches have no action-specific state to populate - Rule.action is
    // always {} for a switch rule.
  }

  private _applyRuleTemplate = (rule: Rule): void => {
    this._hydrateFromRule(rule);
  };

  private _openTemplatePicker = (): void => {
    this._templatePicker?.showDialog(this._deviceType, this._applyRuleTemplate);
  };

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
    } else if (mode === "always") {
      // Dormant in "always" mode (only INCLUDE/EXCLUDE ever consult these),
      // but left set they'd silently reactivate if the rule is later
      // switched back to INCLUDE/EXCLUDE - clearing them here means
      // "always" always means always, with nothing left over to surprise
      // a later edit (including a schedule-conflict auto-fix that flips a
      // rule to EXCLUDE and assumes no leftover date fields).
      this._dates = [];
      this._dateRanges = [];
      this._dayConditions = [];
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

  private _addDateRange = (): void => {
    if (
      !this._newRangeStart ||
      !this._newRangeEnd ||
      this._newRangeStart > this._newRangeEnd
    ) {
      return;
    }
    this._dateRanges = [...this._dateRanges, [this._newRangeStart, this._newRangeEnd]];
    this._newRangeStart = "";
    this._newRangeEnd = "";
  };

  private _removeDateRange = (rangeToRemove: [string, string]): void => {
    this._dateRanges = this._dateRanges.filter(
      (r) => r[0] !== rangeToRemove[0] || r[1] !== rangeToRemove[1],
    );
  };

  /** A live, plain-English summary of what the current date filter actually does. */
  private _summarizeDateFilter(): string {
    const parts = [
      ...this._dates.map((d) => formatDate(d)),
      ...this._dateRanges.map(([start, end]) => `${formatDate(start)}–${formatDate(end)}`),
      ...this._dayConditions.map((c) => DAY_CONDITION_LABELS[c]),
    ];
    if (this._dateMode === "include") {
      return parts.length === 0
        ? "Nothing selected yet - as configured, this rule will never run."
        : `Runs only when it's ${parts.join(", ")} - the Days above are ignored.`;
    }
    return parts.length === 0
      ? "Nothing excluded yet - this behaves the same as “Always”."
      : `Runs on the Days above as usual, except when it's ${parts.join(", ")}.`;
  }

  private _toggleDayCondition = (condition: DayConditionType): void => {
    this._dayConditions = this._dayConditions.includes(condition)
      ? this._dayConditions.filter((c) => c !== condition)
      : [...this._dayConditions, condition];
  };

  /** Returns an error message if the current form state isn't saveable, else null. */
  private _validate(): string | null {
    if (!this._name.trim()) {
      return "Name is required.";
    }
    if (this._dateMode !== "include" && this._days.length === 0) {
      return "At least one day is required.";
    }
    if (
      this._dateMode !== "always" &&
      this._dates.length === 0 &&
      this._dateRanges.length === 0 &&
      this._dayConditions.length === 0
    ) {
      return "At least one date, date range, or special condition is required.";
    }
    if (!this._onEnabled && !this._offEnabled) {
      return "At least one of On time or Off time must be enabled.";
    }
    return null;
  }

  /** Builds the RuleInput from current form state - assumes _validate() already passed. */
  private _buildRuleInput(): RuleInput {
    let action: Action = {};
    if (this._deviceType === "light" || this._deviceType === "light_switch") {
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

    return {
      id: this._rule?.id,
      name: this._name.trim(),
      enabled: this._enabled,
      days: this._days,
      date_mode: this._dateMode,
      dates: this._dates,
      date_ranges: this._dateRanges,
      day_conditions: this._dayConditions,
      on_time: this._onTime,
      off_time: this._offTime,
      on_enabled: this._onEnabled,
      off_enabled: this._offEnabled,
      allow_override: this._allowOverride,
      override_grace_minutes: this._overrideGraceMinutes,
      action,
    };
  }

  private _save = (): void => {
    const error = this._validate();
    if (error) {
      this._error = error;
      return;
    }
    this._onSave?.(this._buildRuleInput());
    this._open = false;
  };

  private _openSaveAsTemplate = (): void => {
    const error = this._validate();
    if (error) {
      this._error = error;
      return;
    }
    this._templateEditor?.showDialog(this._deviceType, [this._buildRuleInput()], "rule");
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

          <button type="button" class="btn" @click=${this._openTemplatePicker}>
            Start from template
          </button>

          <section class="section">
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
          </section>

          <section class="section">
            <h3 class="section-title">When this rule runs</h3>

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
            ${this._dateMode === "include"
              ? html`<span class="hint">Ignored - this rule uses a date filter instead.</span>`
              : nothing}

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
                  <div class="filter-panel">
                    <p class="filter-summary">${this._summarizeDateFilter()}</p>

                    <label class="panel-label">Specific dates</label>
                    <div class="dates">
                      ${this._dates.map(
                        (dateValue) => html`
                          <div class="date-row">
                            <span>${formatDate(dateValue)}</span>
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

                    <label class="panel-label">Date range</label>
                    <div class="dates">
                      ${this._dateRanges.map(
                        (r) => html`
                          <div class="date-row">
                            <span>${formatDate(r[0])} – ${formatDate(r[1])}</span>
                            <button
                              type="button"
                              class="btn"
                              @click=${() => this._removeDateRange(r)}
                            >
                              Remove
                            </button>
                          </div>
                        `,
                      )}
                      <div class="range-add-row">
                        <input
                          type="date"
                          class="native-input"
                          .value=${this._newRangeStart}
                          @input=${(e: Event) => {
                            this._newRangeStart = (e.target as HTMLInputElement).value;
                          }}
                        />
                        <span class="sep">to</span>
                        <input
                          type="date"
                          class="native-input"
                          .value=${this._newRangeEnd}
                          @input=${(e: Event) => {
                            this._newRangeEnd = (e.target as HTMLInputElement).value;
                          }}
                        />
                        <button type="button" class="btn" @click=${this._addDateRange}>
                          Add range
                        </button>
                      </div>
                    </div>

                    <label class="panel-label">Special conditions (YidCal)</label>
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
                      confirmed for today - a future Shabbos/Yom Tov won't
                      show up in "Next event" ahead of time, but the rule
                      still applies correctly once that day arrives.
                    </span>
                  </div>
                `
              : nothing}
          </section>

          <section class="section">
            <h3 class="section-title">Time</h3>
            <div class="time-columns">
              ${this._renderTimeFields(
                "On time",
                this._onTime,
                (spec) => (this._onTime = spec),
                this._onEnabled,
                (enabled) => (this._onEnabled = enabled),
              )}
              ${this._renderTimeFields(
                "Off time",
                this._offTime,
                (spec) => (this._offTime = spec),
                this._offEnabled,
                (enabled) => (this._offEnabled = enabled),
              )}
            </div>
          </section>

          <section class="section">
            <h3 class="section-title">Action</h3>
            ${this._renderActionFields()}
          </section>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._openSaveAsTemplate}>
              Save as template
            </button>
            <span class="spacer"></span>
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button type="button" class="btn btn-primary" @click=${this._save}>Save</button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-template-editor .hass=${this.hass}></scheduler-plus-template-editor>
      <scheduler-plus-rule-template-picker
        .hass=${this.hass}
      ></scheduler-plus-rule-template-picker>
    `;
  }

  private _renderTimeFields(
    label: string,
    spec: TimeSpec,
    onChange: (spec: TimeSpec) => void,
    enabled: boolean,
    onToggle: (enabled: boolean) => void,
  ) {
    const selectedKey = TIME_OPTIONS.find((option) => option.matches(spec))?.key ?? "fixed";

    return html`
      <div class="time-field">
        <ha-formfield label=${label}>
          <ha-switch
            .checked=${enabled}
            @change=${(e: Event) => {
              onToggle((e.target as HTMLInputElement).checked);
            }}
          ></ha-switch>
        </ha-formfield>
        ${enabled
          ? html`
              <div class="time-row">
                <select
                  class="native-select"
                  .value=${selectedKey}
                  @change=${(e: Event) => {
                    const key = (e.target as HTMLSelectElement).value;
                    const option = TIME_OPTIONS.find((o) => o.key === key);
                    if (option) {
                      onChange(option.makeSpec());
                    }
                  }}
                >
                  ${TIME_OPTIONS.map(
                    (option) => html`<option value=${option.key}>${option.label}</option>`,
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
                              ...spec.params,
                              offset_minutes:
                                Number((e.target as HTMLInputElement).value) || 0,
                            },
                          })}
                      />
                      <span class="hint">minutes</span>
                    `}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _renderActionFields() {
    if (this._deviceType === "light" || this._deviceType === "light_switch") {
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
      ${this._preferences.enable_brightness
        ? html`
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
          `
        : nothing}
      ${this._preferences.enable_fade_in
        ? html`
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

      <ha-formfield label="Allow override">
        <ha-switch
          .checked=${this._allowOverride}
          @change=${(e: Event) => {
            this._allowOverride = (e.target as HTMLInputElement).checked;
          }}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        ${this._allowOverride
          ? "Manual changes made directly on the thermostat stick until the next scheduled event."
          : `If someone changes this away from the rule's setting, Scheduler+ waits ${this._overrideGraceMinutes} minutes and then reapplies it if it still doesn't match.`}
      </span>
      ${!this._allowOverride
        ? html`
            <label class="field-label" for="override-grace-minutes">
              Grace period (minutes)
            </label>
            <input
              id="override-grace-minutes"
              type="number"
              min="1"
              class="native-input"
              .value=${String(this._overrideGraceMinutes)}
              @input=${(e: Event) => {
                this._overrideGraceMinutes =
                  Number((e.target as HTMLInputElement).value) || 1;
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
      max-width: 420px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 18px;
      border-top: 1px solid var(--divider-color);
    }
    .section:first-of-type {
      padding-top: 0;
      border-top: none;
    }
    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .filter-summary {
      margin: 0 0 4px;
      font-size: 0.9em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .panel-label {
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--secondary-text-color);
      margin-top: 6px;
    }
    .panel-label:first-of-type {
      margin-top: 0;
    }
    .range-add-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .range-add-row .native-input {
      flex: 1;
      min-width: 0;
    }
    .range-add-row .sep {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      flex: none;
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
    .time-columns {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .time-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1 1 200px;
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
