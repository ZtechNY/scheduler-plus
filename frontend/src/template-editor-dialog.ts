import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, RuleInput } from "./api";
import { createTemplate } from "./api";
import type { DeviceType, TemplateScope } from "./types";

/**
 * "Save as template" - a nested child of both scheduler-plus-schedule-
 * editor (whole rule set, scope="schedule") and scheduler-plus-rule-editor
 * (one rule, scope="rule"): opened imperatively via showDialog(),
 * pre-filled with the caller's current in-progress device type/rules
 * rather than re-collecting them, so a manager doesn't have to rebuild
 * anything from scratch just to save what they already configured.
 * Persists immediately via createTemplate - unlike the rule editor,
 * there's no parent save step to defer to, since a template is
 * independent of whether the schedule/rule itself ends up being saved.
 */
@customElement("scheduler-plus-template-editor")
export class SchedulerPlusTemplateEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _name = "";

  @state() private _saving = false;

  @state() private _error?: string;

  private _deviceType?: DeviceType;

  private _rules: RuleInput[] = [];

  private _scope: TemplateScope = "schedule";

  public showDialog(deviceType: DeviceType, rules: RuleInput[], scope: TemplateScope): void {
    this._deviceType = deviceType;
    this._rules = rules;
    this._scope = scope;
    this._name = "";
    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _save = async (): Promise<void> => {
    const name = this._name.trim();
    if (!name) {
      this._error = "Name is required.";
      return;
    }
    if (this._rules.length === 0) {
      this._error = "Add at least one rule before saving as a template.";
      return;
    }
    if (!this._deviceType) {
      return;
    }

    this._saving = true;
    this._error = undefined;
    try {
      await createTemplate(this.hass, {
        name,
        device_type: this._deviceType,
        rules: this._rules,
        scope: this._scope,
      });
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
          <div class="dialog-title">
            ${this._scope === "rule" ? "Save rule as template" : "Save schedule as template"}
          </div>
          <span class="hint">
            ${this._scope === "rule"
              ? "Saves this one rule as a reusable template - no specific entities - so it can be added to another schedule later via \"Start from template\"."
              : "Saves this schedule's device type and rules as a reusable template - no specific entities - so another schedule can be built from the same setup later via \"From template\"."}
          </span>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <label class="field-label" for="template-name">Template name</label>
          <input
            id="template-name"
            type="text"
            class="native-input"
            placeholder="Standard Classroom Weekday"
            .value=${this._name}
            @input=${(e: Event) => {
              this._name = (e.target as HTMLInputElement).value;
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
              Save template
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
    "scheduler-plus-template-editor": SchedulerPlusTemplateEditor;
  }
}
