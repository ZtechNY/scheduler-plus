import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { HomeAssistant } from "./api";

/**
 * Multi-select entity picker: check several devices at once and add them
 * all in one action, instead of the pick-one-then-a-fresh-box-appears
 * cycle a single ha-entity-picker forces.
 *
 * Built from plain native elements (search input + checkbox list) rather
 * than reaching for a richer HA component like ha-entities-picker. This
 * session hit several HA form components that didn't render or behave
 * correctly from this card's standalone bundle (ha-dialog's own header/
 * actions chrome, ha-textfield, mwc-button) - ha-entities-picker has never
 * been used anywhere in this codebase, so rather than gamble on an
 * unverified component, this uses only `hass.states` (already proven
 * reliable - see day-view-dialog.ts's entity-name lookup) plus plain
 * checkboxes.
 */
@customElement("scheduler-plus-entity-multi-picker")
export class SchedulerPlusEntityMultiPicker extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  /** Currently selected entity_ids. */
  @property({ attribute: false }) value: string[] = [];

  /** Domains (e.g. ["light", "switch"]) a candidate entity_id must start with. */
  @property({ attribute: false }) domains: string[] = [];

  /** If set, candidates are further restricted to exactly these entity_ids. */
  @property({ attribute: false }) includeEntities?: string[];

  @state() private _search = "";

  @state() private _pending = new Set<string>();

  private _entityName(entityId: string): string {
    const friendlyName = this.hass.states[entityId]?.attributes.friendly_name;
    return typeof friendlyName === "string" ? friendlyName : entityId;
  }

  private get _candidates(): string[] {
    const search = this._search.trim().toLowerCase();
    return Object.keys(this.hass.states)
      .filter((id) => this.domains.some((domain) => id.startsWith(`${domain}.`)))
      .filter((id) => !this.value.includes(id))
      .filter((id) => !this.includeEntities || this.includeEntities.includes(id))
      .filter(
        (id) =>
          !search ||
          id.toLowerCase().includes(search) ||
          this._entityName(id).toLowerCase().includes(search),
      )
      .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _fireChange(value: string[]): void {
    this.value = value;
    this.dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
  }

  private _removeEntity(entityId: string): void {
    this._fireChange(this.value.filter((id) => id !== entityId));
  }

  private _toggleCandidate(entityId: string): void {
    const next = new Set(this._pending);
    if (next.has(entityId)) {
      next.delete(entityId);
    } else {
      next.add(entityId);
    }
    this._pending = next;
  }

  private _addSelected = (): void => {
    if (this._pending.size === 0) {
      return;
    }
    this._fireChange([...this.value, ...this._pending]);
    this._pending = new Set();
    this._search = "";
  };

  protected override render() {
    const addLabel =
      this._pending.size > 0
        ? `Add ${this._pending.size} device${this._pending.size === 1 ? "" : "s"}`
        : "Add selected";

    return html`
      ${this.value.length > 0
        ? html`
            <ul class="selected">
              ${this.value.map(
                (entityId) => html`
                  <li class="chip">
                    <span>${this._entityName(entityId)}</span>
                    <button
                      type="button"
                      class="chip-remove"
                      aria-label="Remove ${this._entityName(entityId)}"
                      @click=${() => this._removeEntity(entityId)}
                    >
                      ×
                    </button>
                  </li>
                `,
              )}
            </ul>
          `
        : nothing}

      <input
        type="text"
        class="native-input"
        placeholder="Search devices…"
        .value=${this._search}
        @input=${(e: Event) => {
          this._search = (e.target as HTMLInputElement).value;
        }}
      />
      <div class="candidates">
        ${this._candidates.length === 0
          ? html`<div class="empty">No matching devices.</div>`
          : this._candidates.map(
              (entityId) => html`
                <label class="candidate">
                  <input
                    type="checkbox"
                    .checked=${this._pending.has(entityId)}
                    @change=${() => this._toggleCandidate(entityId)}
                  />
                  <span>${this._entityName(entityId)}</span>
                </label>
              `,
            )}
      </div>
      <button
        type="button"
        class="btn btn-primary"
        ?disabled=${this._pending.size === 0}
        @click=${this._addSelected}
      >
        ${addLabel}
      </button>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* Wrapping chips instead of one full-width row per entity - a schedule
       with dozens of entities (a whole building's worth of rooms) used to
       mean dozens of rows and a lot of scrolling just to see them all. */
    ul.selected {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px 4px 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      background: var(--card-background-color);
      font-size: 0.85em;
      color: var(--primary-text-color);
      max-width: 100%;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip-remove {
      flex: none;
      font: inherit;
      font-size: 1rem;
      line-height: 1;
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .chip-remove:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.08));
      color: var(--primary-text-color);
    }
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .candidates {
      display: flex;
      flex-direction: column;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
    }
    .candidate {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      font-size: 0.9em;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .candidate:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    }
    .candidate input {
      flex: none;
    }
    .empty {
      padding: 10px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      text-align: center;
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
      align-self: flex-start;
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
    .btn-primary:disabled {
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "scheduler-plus-entity-multi-picker": SchedulerPlusEntityMultiPicker;
  }
}
