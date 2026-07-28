import { mdiDelete } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant, ScheduleTemplate } from "./api";
import { createScheduleFromTemplate, deleteTemplate, fetchTemplates } from "./api";
import "./entity-multi-picker";
import { DEVICE_TYPE_DOMAINS, DEVICE_TYPE_LABELS } from "./types";

/**
 * "From template": browse saved schedule templates and turn one into a
 * real schedule. A two-step flow in one dialog rather than two separate
 * dialogs - picking "Use" on a template row reveals the Name/Entities
 * fields needed to materialize it, keeping template management (the list
 * + Delete) and template application (the form) together since browsing
 * templates is what motivates opening this dialog in the first place.
 */
@customElement("scheduler-plus-apply-template-dialog")
export class SchedulerPlusApplyTemplateDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  /** The owning card's own device filter, if configured - see scheduler-plus-card.ts. */
  @property({ attribute: false }) entityFilter?: string[];

  @state() private _open = false;

  @state() private _templates: ScheduleTemplate[] = [];

  @state() private _loading = false;

  @state() private _error?: string;

  @state() private _selected?: ScheduleTemplate;

  @state() private _name = "";

  @state() private _entities: string[] = [];

  @state() private _saving = false;

  public showDialog(): void {
    this._selected = undefined;
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
      this._templates = await fetchTemplates(this.hass);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _selectTemplate = (template: ScheduleTemplate): void => {
    this._selected = template;
    this._name = template.name;
    this._entities = [];
    this._error = undefined;
  };

  private _backToList = (): void => {
    this._selected = undefined;
    this._error = undefined;
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

  private _createFromTemplate = async (): Promise<void> => {
    if (!this._selected) {
      return;
    }
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
      await createScheduleFromTemplate(this.hass, this._selected.id, name, this._entities);
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
          <div class="dialog-title">From template</div>
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          ${this._selected ? this._renderApplyForm(this._selected) : this._renderTemplateList()}
        </div>
      </ha-dialog>
    `;
  }

  private _renderTemplateList() {
    if (this._loading) {
      return html`<div class="placeholder">Loading templates…</div>`;
    }
    if (this._templates.length === 0) {
      return html`
        <div class="placeholder">
          No templates saved yet. Save one from an existing schedule's editor
          ("Save as template").
        </div>
        <div class="dialog-actions">
          <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
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
                <button type="button" class="btn" @click=${() => this._selectTemplate(template)}>
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
      <div class="dialog-actions">
        <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
      </div>
    `;
  }

  private _renderApplyForm(template: ScheduleTemplate) {
    return html`
      <span class="hint">
        Creating a new schedule from "${template.name}"
        (${DEVICE_TYPE_LABELS[template.device_type]}) - pick a name and the
        entities it should control.
      </span>

      <label class="field-label" for="apply-template-name">Name</label>
      <input
        id="apply-template-name"
        type="text"
        class="native-input"
        .value=${this._name}
        @input=${(e: Event) => {
          this._name = (e.target as HTMLInputElement).value;
        }}
      />

      <label class="field-label">Entities</label>
      <scheduler-plus-entity-multi-picker
        .hass=${this.hass}
        .value=${this._entities}
        .domains=${DEVICE_TYPE_DOMAINS[template.device_type]}
        .includeEntities=${this.entityFilter}
        @value-changed=${(e: CustomEvent<{ value: string[] }>) => {
          this._entities = e.detail.value;
        }}
      ></scheduler-plus-entity-multi-picker>

      <div class="dialog-actions">
        <button type="button" class="btn" @click=${this._backToList}>Back</button>
        <button
          type="button"
          class="btn btn-primary"
          ?disabled=${this._saving}
          @click=${this._createFromTemplate}
        >
          Create schedule
        </button>
      </div>
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
    "scheduler-plus-apply-template-dialog": SchedulerPlusApplyTemplateDialog;
  }
}
