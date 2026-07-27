import { mdiDelete } from "@mdi/js";
import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import type { HomeAssistant, ScheduleInput } from "./api";
import { createSchedule, updateSchedule } from "./api";
import type { DeviceType, Schedule } from "./types";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "./types";

/**
 * Dialog for creating or editing a schedule's top-level fields (name,
 * device type, enabled, entities). Rule editing (days/time/action) is not
 * part of this dialog yet - a schedule created here starts with no rules,
 * and editing an existing schedule preserves its rules unchanged, since
 * update_schedule replaces the whole schedule and there is not yet a UI
 * for touching rules individually.
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

  @state() private _saving = false;

  @state() private _error?: string;

  public showDialog(schedule?: Schedule): void {
    this._schedule = schedule;
    this._name = schedule?.name ?? "";
    this._deviceType = schedule?.device_type ?? "light";
    this._enabled = schedule?.enabled ?? true;
    this._entities = schedule ? [...schedule.entities] : [];
    this._error = undefined;
    this._open = true;
  }

  private _closeDialog = (): void => {
    this._open = false;
  };

  private _handleDeviceTypeChange = (event: Event): void => {
    this._deviceType = (event.target as HTMLSelectElement).value as DeviceType;
    // Entities picked for the previous device type would no longer match
    // this one's domain, so they can't carry over.
    this._entities = [];
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
        // Preserve the schedule's existing rules verbatim - this dialog
        // does not edit them, and update_schedule replaces the whole
        // schedule, so omitting them would delete all of a schedule's
        // rules on a simple rename.
        rules: this._schedule?.rules ?? [],
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
      <ha-dialog
        open
        .heading=${this._schedule ? "Edit schedule" : "Add schedule"}
        @closed=${this._closeDialog}
      >
        <div class="form">
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

          <ha-textfield
            label="Name"
            .value=${this._name}
            @input=${(e: InputEvent) => {
              this._name = (e.target as HTMLInputElement).value;
            }}
          ></ha-textfield>

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
            <ha-entity-picker
              .hass=${this.hass}
              .includeDomains=${[this._deviceType]}
              @value-changed=${(e: CustomEvent<{ value?: string }>) =>
                this._addEntity(e.detail.value)}
            ></ha-entity-picker>
          </div>
        </div>

        <mwc-button slot="secondaryAction" @click=${this._closeDialog}>
          Cancel
        </mwc-button>
        <mwc-button slot="primaryAction" .disabled=${this._saving} @click=${this._save}>
          Save
        </mwc-button>
      </ha-dialog>
    `;
  }

  static override styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
    }
    .error {
      color: var(--error-color);
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-select {
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-schedule-editor": SchedulerPlusScheduleEditor;
  }
}
