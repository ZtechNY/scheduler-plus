import { LitElement, css, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { RuleInput } from "./api";
import type { Action, DeviceType, TimeProviderType, TimeSpec, Weekday } from "./types";
import {
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
 * Dialog for adding or editing a single Rule (days/on-time/off-time/action)
 * within a schedule. Purely local state: unlike the schedule editor, a rule
 * has no independent websocket command of its own - create_schedule and
 * update_schedule always replace a schedule's entire rules array - so this
 * dialog hands its result back to the caller via an `onSave` callback
 * instead of round-tripping through the server itself.
 */
@customElement("scheduler-plus-rule-editor")
export class SchedulerPlusRuleEditor extends LitElement {
  @state() private _open = false;

  @state() private _deviceType: DeviceType = "light";

  @state() private _name = "";

  @state() private _enabled = true;

  @state() private _days: Weekday[] = [];

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

    this._name = rule?.name ?? "";
    this._enabled = rule?.enabled ?? true;
    this._days = rule ? [...rule.days] : [];
    this._onTime = rule?.on_time ?? { provider: "fixed", params: { time: "06:00" } };
    this._offTime = rule?.off_time ?? { provider: "fixed", params: { time: "21:00" } };

    if (deviceType === "light") {
      this._setBrightness = rule?.action.brightness !== undefined;
      const brightness = (rule?.action.brightness as number | undefined) ?? 255;
      this._brightnessPct = Math.round((brightness / 255) * 100);
      this._useTransition = rule?.action.transition !== undefined;
      this._transitionSeconds = (rule?.action.transition as number | undefined) ?? 0;
    } else {
      this._hvacMode = (rule?.action.hvac_mode as string | undefined) ?? "heat";
      this._useTargetTemperature = rule?.action.target_temperature !== undefined;
      this._targetTemperature = (rule?.action.target_temperature as number | undefined) ?? 70;
    }

    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _toggleDay = (day: Weekday): void => {
    this._days = this._days.includes(day)
      ? this._days.filter((d) => d !== day)
      : [...this._days, day];
  };

  private _save = (): void => {
    const name = this._name.trim();
    if (!name) {
      this._error = "Name is required.";
      return;
    }
    if (this._days.length === 0) {
      this._error = "At least one day is required.";
      return;
    }

    const action: Action =
      this._deviceType === "light"
        ? {
            ...(this._setBrightness
              ? { brightness: Math.round((this._brightnessPct / 100) * 255) }
              : {}),
            ...(this._useTransition ? { transition: this._transitionSeconds } : {}),
          }
        : {
            hvac_mode: this._hvacMode,
            ...(this._useTargetTemperature
              ? { target_temperature: this._targetTemperature }
              : {}),
          };

    this._onSave?.({
      id: this._rule?.id,
      name,
      enabled: this._enabled,
      days: this._days,
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

          <ha-textfield
            label="Name"
            .value=${this._name}
            @input=${(e: InputEvent) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
          ></ha-textfield>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${(e: Event) => {
                this._enabled = (e.target as HTMLInputElement).checked;
              }}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Days</label>
          <div class="days">
            ${WEEKDAYS.map(
              (day) => html`
                <button
                  type="button"
                  class="day-chip ${this._days.includes(day) ? "active" : ""}"
                  @click=${() => this._toggleDay(day)}
                >
                  ${WEEKDAY_LABELS[day].slice(0, 3)}
                </button>
              `,
            )}
          </div>

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

          ${this._deviceType === "light"
            ? this._renderLightAction()
            : this._renderClimateAction()}

          <div class="dialog-actions">
            <mwc-button @click=${this._closeDialog}>Cancel</mwc-button>
            <mwc-button @click=${this._save}>Save</mwc-button>
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
            <ha-textfield
              label="Fade duration (seconds)"
              type="number"
              .value=${String(this._transitionSeconds)}
              @input=${(e: InputEvent) => {
                this._transitionSeconds =
                  Number((e.target as HTMLInputElement).value) || 0;
              }}
            ></ha-textfield>
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
            <ha-textfield
              label="Target temperature"
              type="number"
              .value=${String(this._targetTemperature)}
              @input=${(e: InputEvent) => {
                this._targetTemperature =
                  Number((e.target as HTMLInputElement).value) || 0;
              }}
            ></ha-textfield>
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
