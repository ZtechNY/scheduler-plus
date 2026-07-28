import { mdiDelete } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, ScheduleTemplate } from "./api";
import { deleteTemplate, fetchTemplates } from "./api";
import { DEVICE_TYPE_LABELS } from "./types";

/**
 * "From template": browse saved schedule templates (scope="schedule" -
 * rule templates live only in the rule editor's "Start from template" and
 * never show here) and hand one off to be applied. "Use" doesn't create a
 * schedule directly - it dispatches scheduler-plus-use-template and closes,
 * so the card can open the full schedule editor pre-filled from the
 * template, letting the manager add entities and review/adjust rules
 * before saving, exactly like creating a schedule from scratch.
 */
@customElement("scheduler-plus-apply-template-dialog")
export class SchedulerPlusApplyTemplateDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _open = false;

  @state() private _templates: ScheduleTemplate[] = [];

  @state() private _loading = false;

  @state() private _error?: string;

  public showDialog(): void {
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
      this._templates = templates.filter((template) => template.scope === "schedule");
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _useTemplate = (template: ScheduleTemplate): void => {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent("scheduler-plus-use-template", { detail: { template } }),
    );
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
          <div class="dialog-title">From template</div>
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
          No schedule templates saved yet. Save one from an existing
          schedule's editor ("Save as template").
        </div>
      `;
    }
    return html`
      <ul class="templates">
        ${this._templates.map(
          (template) => html`
            <li class="template">
              <div class="template-info">
                <span class="template-name">${template.name}</span>
                <span class="template-meta">
                  ${DEVICE_TYPE_LABELS[template.device_type]} ·
                  ${template.rules.length}
                  ${template.rules.length === 1 ? "rule" : "rules"}
                </span>
              </div>
              <div class="row-actions">
                <button type="button" class="btn" @click=${() => this._useTemplate(template)}>
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
      min-width: 320px;
      max-width: 420px;
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
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .template:last-child {
      border-bottom: none;
    }
    .template-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .template-name {
      font-weight: 500;
    }
    .template-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .row-actions {
      display: flex;
      align-items: center;
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
    "scheduler-plus-apply-template-dialog": SchedulerPlusApplyTemplateDialog;
  }
}
