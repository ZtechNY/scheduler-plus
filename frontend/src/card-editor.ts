import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant } from "./api";
import "./entity-multi-picker";
import type { SchedulerPlusCardConfig } from "./scheduler-plus-card";
import { ALL_DEVICE_DOMAINS } from "./types";

/**
 * Visual editor for the Scheduler+ card, opened from Lovelace's own "Edit
 * card" dialog (wired up via SchedulerPlusCard.getConfigElement()). Lets a
 * dashboard page restrict which schedules its card instance shows, by
 * device - the same "one card per page, each with its own device filter"
 * pattern used by other entity-scoped Lovelace cards, rather than a single
 * global visibility setting.
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
        <scheduler-plus-entity-multi-picker
          .hass=${this.hass}
          .value=${this._config.entities ?? []}
          .domains=${ALL_DEVICE_DOMAINS}
          @value-changed=${(e: CustomEvent<{ value: string[] }>) => {
            this._fireConfigChanged({ ...this._config!, entities: e.detail.value });
          }}
        ></scheduler-plus-entity-multi-picker>
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-card-editor": SchedulerPlusCardEditor;
  }
}
