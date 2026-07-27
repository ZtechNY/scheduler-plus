import { mdiDelete } from "@mdi/js";
import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";

import type { HomeAssistant } from "./api";
import type { SchedulerPlusCardConfig } from "./scheduler-plus-card";
import { DEVICE_TYPES } from "./types";

/**
 * Visual editor for the Scheduler+ card, opened from Lovelace's own "Edit
 * card" dialog (wired up via SchedulerPlusCard.getConfigElement()). Lets a
 * dashboard page restrict which schedules its card instance shows, by
 * device - the same "one card per page, each with its own device filter"
 * pattern used by other entity-scoped Lovelace cards, rather than a single
 * global visibility setting.
 *
 * Reuses the exact repeated-ha-entity-picker-rows pattern already proven
 * reliable in schedule-editor-dialog.ts's Entities section (including the
 * keyed() fix for the trailing "add" picker), rather than reaching for
 * ha-entities-picker (a different, untested component in this environment).
 */
@customElement("scheduler-plus-card-editor")
export class SchedulerPlusCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config?: SchedulerPlusCardConfig;

  setConfig(config: SchedulerPlusCardConfig): void {
    this._config = config;
  }

  private _fireConfigChanged(config: SchedulerPlusCardConfig): void {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config } }));
  }

  private _handleTitleChange = (e: Event): void => {
    const title = (e.target as HTMLInputElement).value;
    this._fireConfigChanged({
      ...this._config!,
      title: title || undefined,
    });
  };

  private get _entities(): string[] {
    return this._config?.entities ?? [];
  }

  private _addEntity = (entityId: string | undefined): void => {
    if (!entityId || this._entities.includes(entityId)) {
      return;
    }
    this._fireConfigChanged({ ...this._config!, entities: [...this._entities, entityId] });
  };

  private _updateEntity = (index: number, entityId: string | undefined): void => {
    if (!entityId) {
      this._removeEntity(index);
      return;
    }
    const entities = this._entities.map((existing, i) => (i === index ? entityId : existing));
    this._fireConfigChanged({ ...this._config!, entities });
  };

  private _removeEntity = (index: number): void => {
    const entities = this._entities.filter((_, i) => i !== index);
    this._fireConfigChanged({ ...this._config!, entities });
  };

  protected override render() {
    if (!this._config) {
      return html``;
    }
    return html`
      <div class="editor">
        <label class="field-label" for="card-title">Title</label>
        <input
          id="card-title"
          type="text"
          class="native-input"
          .value=${this._config.title ?? ""}
          @input=${this._handleTitleChange}
        />

        <label class="field-label">Devices to show</label>
        <span class="hint">
          Leave empty to show every schedule. Otherwise, only schedules
          targeting at least one of these devices appear in this card -
          useful for putting a device-specific card on a room's own
          dashboard page.
        </span>
        <div class="entities">
          ${repeat(
            this._entities,
            (entityId) => entityId,
            (entityId, index) => html`
              <div class="entity-row">
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${entityId}
                  .includeDomains=${DEVICE_TYPES}
                  @value-changed=${(e: CustomEvent<{ value?: string }>) =>
                    this._updateEntity(index, e.detail.value)}
                ></ha-entity-picker>
                <ha-icon-button
                  .path=${mdiDelete}
                  label="Remove device"
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
                .includeDomains=${DEVICE_TYPES}
                @value-changed=${(e: CustomEvent<{ value?: string }>) =>
                  this._addEntity(e.detail.value)}
              ></ha-entity-picker>
            `,
          )}
        </div>
      </div>
    `;
  }

  static override styles = css`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .hint {
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
    "scheduler-plus-card-editor": SchedulerPlusCardEditor;
  }
}
