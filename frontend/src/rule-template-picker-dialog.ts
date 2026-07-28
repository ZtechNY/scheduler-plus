import { mdiDelete } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, ScheduleTemplate } from "./api";
import { deleteTemplate, fetchTemplates } from "./api";
import type { DeviceType, Rule } from "./types";

/**
 * "Start from template", opened from the rule editor. Reuses the exact
 * same template storage as whole-schedule templates (scheduler_plus
 * templates), filtered to scope="rule" (see TemplateScope in models.py)
 * and the current rule's device_type - a light action wouldn't make sense
 * applied to a climate rule, and a schedule-scoped template belongs in the
 * card's "From template" list instead, never here. Since rule templates
 * are never listed anywhere else, this is also where they're deleted from.
 */
@customElement("scheduler-plus-rule-template-picker")
export class SchedulerPlusRuleTemplatePicker extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _templates: ScheduleTemplate[] = [];

  @state() private _loading = false;

  @state() private _error?: string;

  private _deviceType?: DeviceType;

  private _onPick?: (rule: Rule) => void;

  public showDialog(deviceType: DeviceType, onPick: (rule: Rule) => void): void {
    this._deviceType = deviceType;
    this._onPick = onPick;
    this._error = undefined;
    this._open = true;
    void this._load();
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private async _load(): Promise<void> {
    this._loading = true;
    this._error = undefined;
    try {
      const templates = await fetchTemplates(this.hass);
      this._templates = templates.filter(
        (template) => template.scope === "rule" && template.device_type === this._deviceType,
      );
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _pick = (template: ScheduleTemplate): void => {
    const rule = template.rules[0];
    if (!rule) {
      return;
    }
    this._onPick?.(rule);
    this._open = false;
  };

  private _deleteTemplateRow = async (template: ScheduleTemplate): Promise<void> => {
    if (!window.confirm(`Delete template "${template.name}"?`)) {
      return;
    }
    try {
      await deleteTemplate(this.hass, template.id);
      await this._load();
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
          <div class="dialog-title">Start from template</div>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          ${this._renderContent()}
          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `;
  }

  private _renderContent() {
    if (this._loading) {
      return html`<div class="placeholder">Loading templates…</div>`;
    }
    if (this._templates.length === 0) {
      return html`
        <div class="placeholder">
          No rule templates saved yet for this device type. Save one from a
          rule's editor with "Save as template".
        </div>
      `;
    }
    return html`
      <ul class="templates">
        ${this._templates.map(
          (template) => html`
            <li class="template">
              <span class="template-name">${template.name}</span>
              <div class="row-actions">
                <button type="button" class="btn" @click=${() => this._pick(template)}>
                  Use
                </button>
                <ha-icon-button
                  .path=${mdiDelete}
                  label="Delete template"
                  @click=${() => this._deleteTemplateRow(template)}
                ></ha-icon-button>
              </div>
            </li>
          `,
        )}
      </ul>
    `;
  }

  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 280px;
      max-width: 400px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .error {
      color: var(--error-color);
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    ul.templates {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .template {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .template:last-child {
      border-bottom: none;
    }
    .template-name {
      font-weight: 500;
    }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-rule-template-picker": SchedulerPlusRuleTemplatePicker;
  }
}
