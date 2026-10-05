import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchModes, fetchSchedules, fetchWeekSchedule, fetchDaySchedule, saveMode, deleteMode, setModeDate, formatApiError } from "./api";
import type { HomeAssistant, OperatingMode, ModesResult, DayScheduleEvent } from "./api";
import type { Schedule, Weekday } from "./types";
import { WEEKDAYS, WEEKDAY_LABELS } from "./types";
import { formatAction } from "./format-action";

/**
 * Starting points offered when no mode exists yet - purely a head start on
 * typing, never anything the backend knows about. They live here (and are
 * overridable per card via `mode_presets`) rather than in the integration's
 * translations/, because a Lovelace card can't read backend translations:
 * those cover config flow text and entity names, not card copy.
 */
const DEFAULT_MODE_PRESETS = [
  "No school",
  "Short day",
  "Bris",
  "Chasunah",
  "Rabbi here",
  "Rabbi away",
  "Friday night Tish",
];

/** How often the outlook re-polls, while the tab is actually visible. */
const REFRESH_MS = 30000;

interface DashboardConfig {
  type?: string;
  title?: string;
  modes?: string[];
  mode_presets?: string[];
  show_devices?: boolean;
  default_view?: DashboardView;
}

type DashboardView = "now" | "24h" | "week";

/** Days of forecast each view needs beyond today - see _fetchEvents. */
const VIEW_SPAN: Record<DashboardView, number> = { now: 0, "24h": 1, week: 7 };

function addDays(day: string, count: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/**
 * Mirrors modes.mode_active in the backend: an explicit date choice wins,
 * otherwise the weekly repeat decides. Kept in sync by hand - the two are
 * tested against the same cases (tests/test_modes.py).
 */
function active(mode: OperatingMode, day: string) {
  const weekday = WEEKDAYS[(new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7]!;
  return mode.dates[day] ?? mode.weekdays.includes(weekday);
}

/** What to tell the user after a mode change paused schedules behind their back. */
function pausedNotice(names: string[]) {
  if (!names.length) return "";
  const quoted = names.map((name) => `“${name}”`).join(", ");
  const subject = names.length === 1 ? "it is" : "they are";
  return `Paused ${quoted}: ${subject} no longer set to run in any mode. Re-enable in the main Scheduler+ card once assigned to one.`;
}

/** Show the device/action/timing details of a schedule while assigning it to a mode. */
function modeScheduleDetails(schedule: Schedule) {
  const type = schedule.device_type === "climate" ? "Climate" : "Lights & switches";
  const deviceCount = `${schedule.entities.length} ${schedule.entities.length === 1 ? "device" : "devices"}`;
  const rule = schedule.rules.find((candidate) => candidate.enabled && candidate.on_enabled);
  const offRule = schedule.rules.find((candidate) => candidate.enabled && candidate.off_enabled);
  const actionType = schedule.device_type === "light_switch" ? "light" : schedule.device_type;
  const onAction = rule ? formatAction(actionType, rule.action) ?? "Turn on" : "No on action";
  const offAction = offRule
    ? offRule.off_action
      ? formatAction(actionType, offRule.off_action) ?? "Setback"
      : "Turn off"
    : "No off action";
  const timing = rule?.on_time?.provider === "fixed" && typeof rule.on_time.params.time === "string"
    ? `Starts ${rule.on_time.params.time}`
    : rule?.on_time?.provider
      ? `Starts at ${rule.on_time.provider}`
      : "Timing set in schedule";
  return { type, deviceCount, onAction, offAction, timing };
}

@customElement("scheduler-plus-dashboard-card")
export class SchedulerPlusDashboard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  /**
   * Set when the main Scheduler+ card renders this in place of its schedule
   * list. The card chrome then belongs to the host - drawing a second
   * ha-card and a second title inside the first one is what made the
   * embedded copy look like two cards stapled together.
   */
  @property({ type: Boolean, reflect: true }) embedded = false;
  @state() private _config: DashboardConfig = {};
  @state() private _modes: OperatingMode[] = [];
  @state() private _schedules: Schedule[] = [];
  @state() private _events: DayScheduleEvent[] = [];
  @state() private _date = "";
  @state() private _today = "";
  @state() private _timezone = "UTC";
  @state() private _view: DashboardView = "24h";
  @state() private _error = "";
  @state() private _notice = "";
  @state() private _busy = false;
  @state() private _loaded = false;
  @state() private _editing: OperatingMode | null = null;
  private _timer?: ReturnType<typeof setInterval>;
  private _loading = false;
  /**
   * Incremented on every load and on disconnect. A load only writes its
   * results if its own epoch is still the current one, so a slow poll can
   * never land on top of a newer one or on a mode change made since.
   */
  private _epoch = 0;

  setConfig(config: DashboardConfig) {
    this._config = config;
    this._view = config.default_view ?? "24h";
  }
  static getConfigElement() { return document.createElement("scheduler-plus-dashboard-editor"); }
  static getStubConfig() { return { title: "Operations dashboard", default_view: "24h", show_devices: true }; }
  getCardSize() { return 8; }
  override connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(this._tick, REFRESH_MS);
    document.addEventListener("visibilitychange", this._tick);
    if (this.hass) void this._load();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._timer);
    document.removeEventListener("visibilitychange", this._tick);
    this._epoch++;
  }

  /**
   * Polls only while the tab is visible. A dashboard left open in a
   * background tab was otherwise resolving a week of sun/zman times every
   * 30 seconds for nobody to look at; coming back to the tab refreshes
   * immediately, so nothing is stale by more than the round trip.
   */
  private _tick = () => {
    if (!document.hidden) void this._load();
  };

  protected override updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && !this._loaded && !this._loading) void this._load();
  }

  /**
   * Fetches exactly the days the current view renders.
   *
   * Yesterday is always included: an overnight window that started before
   * midnight is still running now, and the "scheduled windows now" count
   * would miss it otherwise. Beyond that, "now" needs nothing further,
   * "24h" needs tomorrow (since now + 24h crosses midnight), and "week"
   * needs the seven days the week query returns plus the day after, for
   * the tail of the range.
   */
  private async _fetchEvents(today: string): Promise<DayScheduleEvent[]> {
    const hass = this.hass!;
    if (this._view === "week") {
      const [yesterday, week, last] = await Promise.all([
        fetchDaySchedule(hass, addDays(today, -1)),
        fetchWeekSchedule(hass, today),
        fetchDaySchedule(hass, addDays(today, VIEW_SPAN.week)),
      ]);
      return [...yesterday, ...week.flatMap((day) => day.events), ...last];
    }
    const offsets = [-1, ...Array.from({ length: VIEW_SPAN[this._view] + 1 }, (_, i) => i)];
    const days = await Promise.all(offsets.map((offset) => fetchDaySchedule(hass, addDays(today, offset))));
    return days.flat();
  }

  private async _load() {
    if (!this.hass) return;
    const epoch = ++this._epoch;
    this._loading = true;
    try {
      const [data, schedules] = await Promise.all([fetchModes(this.hass), fetchSchedules(this.hass)]);
      const events = await this._fetchEvents(data.today);
      // Superseded by a newer load, or the card went away: those results
      // are the current ones, so drop these rather than overwriting them.
      if (epoch !== this._epoch) return;
      this._apply(data);
      this._schedules = schedules;
      this._events = events;
      this._loaded = true;
      this._error = "";
    } catch (error) {
      if (epoch === this._epoch) this._error = formatApiError(error);
    } finally {
      if (epoch === this._epoch) this._loading = false;
    }
  }

  /** Adopt a modes payload, keeping a date the user deliberately picked. */
  private _apply(data: ModesResult) {
    this._modes = data.modes;
    if (!this._date || this._date === this._today) this._date = data.today;
    this._today = data.today;
    this._timezone = data.timezone;
  }

  /**
   * Runs a mode mutation. Every mode command answers with the full modes
   * payload, so the toggle it was called from updates on the response
   * itself; the reload that follows is for the *other* things a mode
   * change moves - schedules it paused, and the forecast.
   */
  private async _write(operation: () => Promise<ModesResult & { paused_schedules?: string[] }>) {
    if (this._busy) return;
    this._busy = true;
    try {
      const result = await operation();
      this._editing = null;
      this._error = "";
      this._notice = pausedNotice(result.paused_schedules ?? []);
      this._apply(result);
      await this._load();
    } catch (error) { this._error = formatApiError(error); }
    finally { this._busy = false; }
  }

  private async _setView(view: DashboardView) {
    if (this._view === view) return;
    this._view = view;
    await this._load();
  }

  private _newMode(name = "") {
    this._edit({ id: "", rev: 0, name, weekdays: [], dates: {}, run_schedules: [], skip_schedules: [] });
  }
  private _edit(mode: OperatingMode) {
    this._editing = structuredClone(mode);
    void this.updateComplete.then(() => this.renderRoot.querySelector(".editor")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }
  private _effect(id: string, value: string) {
    const m = this._editing!;
    this._editing = { ...m,
      run_schedules: [...m.run_schedules.filter(s => s !== id), ...(value === "run" ? [id] : [])],
      skip_schedules: [...m.skip_schedules.filter(s => s !== id), ...(value === "skip" ? [id] : [])],
    };
  }
  private _time(value: string) {
    return new Date(value).toLocaleString(undefined, { timeZone: this._timezone, weekday: "short", hour: "numeric", minute: "2-digit" });
  }
  private _editor() {
    const m = this._editing;
    if (!m) return nothing;
    return html`<section class="editor" aria-label="Configure mode">
      <h2>${m.id ? "Configure mode" : "Create a mode"}</h2>
      <label>Mode name<input maxlength="80" .value=${m.name} @input=${(e: Event) => this._editing = { ...m, name: (e.target as HTMLInputElement).value }} placeholder="e.g. No school"></label>
      <p>Repeat on these days, or leave blank and select individual dates on the dashboard.</p>
      <div class="days">${WEEKDAYS.map(day => html`<label><input type="checkbox" .checked=${m.weekdays.includes(day)} @change=${(e: Event) => this._editing = { ...m, weekdays: (e.target as HTMLInputElement).checked ? [...m.weekdays, day] : m.weekdays.filter(d => d !== day) }}>${WEEKDAY_LABELS[day].slice(0, 3)}</label>`)}</div>
      <h3>Mode includes</h3>
      <p>Build each device action as a schedule in the Schedules view, then include it here. Lights and climate can have different actions and timing: one can turn on once while another starts heating or cooling at its own fixed, sunrise, sunset, or preset system time.</p>
      ${this._schedules.length ? html`<div class="schedule-reference"><b>Available device actions</b>${this._schedules.map(s => { const details = modeScheduleDetails(s); return html`<div class="schedule-reference-row"><span><b>${s.name}</b><small><span class="device-chip">${details.type}</span> · ${details.deviceCount} · ${details.onAction} → ${details.offAction} · ${details.timing}</small></span></div>`; })}</div>` : nothing}
      ${!this._schedules.length ? html`<p>Create schedules in the main Scheduler+ card first, then assign them here.</p>` : this._schedules.map(s => html`<label class="assignment"><span>${s.name}${!s.enabled ? " (paused)" : ""}<small>${s.rules.length} rules · ${s.entities.length} devices</small></span><select .value=${m.run_schedules.includes(s.id) ? "run" : m.skip_schedules.includes(s.id) ? "skip" : "none"} @change=${(e: Event) => this._effect(s.id, (e.target as HTMLSelectElement).value)}><option value="none">Not included</option><option value="run">Include when on</option><option value="skip">Skip when on</option></select></label>`)}
      <p class="note">Changing today's mode recalculates schedules immediately and can start an active rule. Skipping cancels its remaining actions; it does not turn devices off. Use a replacement schedule for an early shutdown. Removing a schedule's last “Run” assignment pauses that schedule. Individual dates are set from the toggles above, not here - this form never overwrites them.</p>
      <div class="row"><button class="primary" ?disabled=${this._busy || !m.name.trim()} @click=${() => this._write(() => saveMode(this.hass!, m))}>${this._busy ? "Saving…" : "Save mode"}</button><button ?disabled=${this._busy} @click=${() => this._editing = null}>Cancel</button>${m.id ? html`<button ?disabled=${this._busy} @click=${() => { if (confirm("Delete this mode? Its exclusive schedules will be paused. Regular schedules it skipped will resume.")) void this._write(() => deleteMode(this.hass!, m.id)); }}>Delete mode</button>` : nothing}</div>
    </section>`;
  }
  protected override render() {
    const now = Date.now();
    // "now" renders active windows rather than a range, so its span of 0 is
    // floored to a day here purely to keep this one expression total.
    const end = now + Math.max(VIEW_SPAN[this._view], 1) * 86400000;
    const visibleModes = this._modes.filter(m => !this._config.modes || this._config.modes.includes(m.id));
    const presets = this._config.mode_presets ?? DEFAULT_MODE_PRESETS;
    const current = this._events.filter(e => e.on_at && e.off_at && Date.parse(e.on_at) <= now && Date.parse(e.off_at) > now);
    const upcoming = this._events.flatMap(e => [
      ...(e.on_at ? [{ at: e.on_at, event: e, label: formatAction(e.device_type, e.action) ?? "On" }] : []),
      ...(e.off_at ? [{ at: e.off_at, event: e, label: e.off_action ? (formatAction(e.device_type, e.off_action) ?? "Setback") : "Off" }] : []),
    ]).filter(e => Date.parse(e.at) > now && Date.parse(e.at) <= end).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const entities = [...new Set(this._schedules.flatMap(s => s.entities))];
    const body = html`
      ${this.embedded ? nothing : html`<header><div class="eyebrow">SCHEDULER+ · OPERATIONS</div><h1>${this._config.title ?? "Your day, under control"}</h1><p>Daily routines and special days, in one place.</p></header>`}
      ${this._error ? html`<div role="alert" class="banner error">${this._error}<button @click=${() => void this._load()}>Retry</button></div>` : nothing}
      ${this._notice ? html`<div role="status" class="banner notice">${this._notice}<button @click=${() => this._notice = ""}>Dismiss</button></div>` : nothing}
      ${!this._loaded ? html`<p class="pad">Loading dashboard…</p>` : html`
      <div class="stats"><div><strong>${this._modes.filter(m => active(m, this._today)).length}</strong><span>Modes on today</span></div><div><strong>${current.length}</strong><span>Scheduled windows now</span></div><div><strong>${entities.length}</strong><span>Connected devices</span></div></div>
      <section><div class="row spread"><div><h2>Day modes</h2><p>Choose a day, switch modes on or off, and let each included device action run at its configured time.</p></div><button @click=${() => this._newMode()}>+ Create mode</button></div>
      <div class="row"><label>Date<input type="date" .value=${this._date} @change=${(e: Event) => { const d = (e.target as HTMLInputElement).value; if (d) this._date = d; }}></label><button @click=${() => this._date = this._today}>Today</button><small>${this._timezone}</small></div>
      ${!this._modes.length ? html`<div class="empty"><h3>Start with a familiar routine</h3><p>Choose a name, then select the schedules it runs or skips.</p><div class="row">${presets.map(name => html`<button @click=${() => this._newMode(name)}>${name}</button>`)}</div></div>` : nothing}
      <div class="grid">${visibleModes.map(m => html`<article class=${active(m, this._date) ? "mode on" : "mode"}><div class="row spread"><h3>${m.name}</h3><button class="toggle" role="switch" aria-label=${`${m.name} on ${this._date}`} aria-checked=${active(m, this._date)} ?disabled=${this._busy} @click=${() => this._write(() => setModeDate(this.hass!, m.id, this._date, !active(m, this._date)))}>${active(m, this._date) ? "On" : "Off"}</button></div><p>${m.run_schedules.length} special schedules · ${m.skip_schedules.length} skipped</p><small>${this._date in m.dates ? "Set for this date" : m.weekdays.length ? "Weekly routine" : "No date selected"}</small><div class="row"><button class="text" @click=${() => this._edit(m)}>Configure</button>${this._date in m.dates ? html`<button class="text" ?disabled=${this._busy} @click=${() => this._write(() => setModeDate(this.hass!, m.id, this._date, null))}>Use weekly routine</button>` : nothing}</div></article>`)}</div>
      <p class="note">Modes apply to the selected date, including events ending the next morning. Skipping a schedule does not switch off a device already running. Past dates are tidied away automatically.</p>
      </section>${this._editor()}
      <section><div class="row spread"><div><h2>Activity outlook</h2><p>From now · ${this._timezone} · refreshes every 30 seconds while this tab is open</p></div><div class="row" role="group" aria-label="Outlook range">${([['now', 'Now'], ['24h', 'Next 24 hours'], ['week', 'Next 7 days']] as const).map(([value, label]) => html`<button aria-pressed=${this._view === value} class=${this._view === value ? "primary" : ""} @click=${() => void this._setView(value)}>${label}</button>`)}</div></div>
      ${this._view === "now" ? html`<p>Scheduled windows are planned activity. Device states below show what is actually happening.</p>${current.length ? current.map(e => html`<div class="event"><span class="dot"></span><div><b>${e.schedule_name}</b><small>${e.rule_name} · until ${this._time(e.off_at!)}</small></div><span>${formatAction(e.device_type, e.action) ?? "On window"}</span></div>`) : html`<div class="empty">No scheduled windows are active right now.</div>`}` : upcoming.length ? upcoming.map((item, index) => { const date = new Date(item.at).toLocaleDateString(undefined, {timeZone: this._timezone, weekday: "long", month: "short", day: "numeric"}); const previous = upcoming[index - 1]; return html`${!previous || new Date(previous.at).toLocaleDateString(undefined, {timeZone: this._timezone}) !== new Date(item.at).toLocaleDateString(undefined, {timeZone: this._timezone}) ? html`<h3 class="day">${date}</h3>` : nothing}<div class="event"><time>${this._time(item.at)}</time><div><b>${item.event.schedule_name}</b><small>${item.event.rule_name} · ${item.event.entities.length} devices</small></div><span class="badge">${item.label}</span></div>`; }) : html`<div class="empty">No actions scheduled in this period.</div>`}
      </section>
      ${this._config.show_devices !== false ? html`<section><h2>Live device states</h2><div class="grid">${entities.map(id => { const entity = this.hass?.states[id]; return html`<div class="device"><b>${entity?.attributes.friendly_name ?? id}</b><span>${entity?.state ?? "unavailable"}</span></div>`; })}</div></section>` : nothing}
      `}`;
    return this.embedded ? body : html`<ha-card>${body}</ha-card>`;
  }
  static override styles = css`
    .schedule-reference{margin:14px 0 18px;padding:12px;border:1px solid var(--divider-color,#dce4e4);border-radius:10px;background:rgba(127,127,127,.04);font-size:12px}.schedule-reference-row{padding:9px 0;border-top:1px solid var(--divider-color,#e7ecec)}.schedule-reference-row:first-of-type{margin-top:8px}.schedule-reference small{font-size:11px;line-height:1.5}.device-chip{color:var(--primary-color);font-weight:700;text-transform:uppercase;letter-spacing:.3px}
    :host{display:block;color:var(--primary-text-color);font-family:inherit}ha-card{overflow:hidden;background:var(--card-background-color,#fff)}header{padding:28px;background:linear-gradient(120deg,rgba(16,145,132,.15),rgba(57,120,201,.08))}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:700;color:var(--primary-color,#087f73)}h1{font-size:28px;margin:10px 0}h2{font-size:19px;margin:0 0 6px}h3{font-size:15px;margin:0}p{font-size:13px;color:var(--secondary-text-color);line-height:1.6;margin:6px 0 14px}section{padding:22px;border-top:1px solid var(--divider-color,#e7ecec)}.stats{display:grid;grid-template-columns:repeat(3,1fr);padding:22px;gap:12px}.stats div{display:flex;flex-direction:column;gap:6px}.stats strong{font-size:28px}.stats span,small{font-size:12px;color:var(--secondary-text-color)}small{display:block;margin-top:5px}.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.spread{justify-content:space-between}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:16px}.mode{padding:17px;border:1px solid var(--divider-color,#dce4e4);border-radius:14px}.mode.on{border-color:#169c89;background:rgba(16,145,132,.07)}.mode p{margin:12px 0 4px}.toggle{min-width:58px;border-radius:30px;font-weight:bold}.on .toggle,.primary{background:var(--primary-color,#087f73);color:var(--text-primary-color,#fff);border-color:transparent}.text{border:0;background:transparent;padding:9px 0;color:var(--primary-color,#087f73);font-size:12px}.empty{padding:22px;border:1px dashed var(--divider-color,#cad5d5);border-radius:12px;margin-top:16px;color:var(--secondary-text-color)}button,input,select{font:inherit;border:1px solid var(--divider-color,#cbd5d5);border-radius:8px;padding:9px 12px;color:var(--primary-text-color);background:var(--card-background-color,#fff)}button{cursor:pointer;font-size:13px}button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}label{font-size:13px;display:flex;gap:8px;align-items:center}input[type=text]{min-width:160px}.editor{background:rgba(16,145,132,.04)}.editor>label{margin:16px 0}.days{display:flex;flex-wrap:wrap;gap:14px;margin:16px 0 24px}.assignment{display:flex;justify-content:space-between;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--divider-color,#ddd)}.note{font-size:12px;margin-top:16px}.event{display:flex;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid var(--divider-color,#eee);font-size:13px}.event>div{flex:1}.event time{min-width:100px;color:var(--secondary-text-color);font-size:12px}.badge{border-radius:8px;padding:6px 10px;background:rgba(16,145,132,.1);max-width:130px}.day{margin-top:22px;color:var(--primary-color)}.dot{width:8px;height:8px;border-radius:50%;background:#169c89}.device{display:flex;justify-content:space-between;gap:12px;padding:12px;background:rgba(127,127,127,.06);border-radius:8px;font-size:13px}:host([embedded]) section:first-of-type{border-top:0}.banner{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px;font-size:13px;line-height:1.5}.banner button{flex:none}.error{background:rgba(220,50,50,.12)}.notice{background:rgba(16,145,132,.12)}.pad{padding:22px}@media(max-width:480px){header,section{padding:16px}h1{font-size:24px}.event{gap:8px}.event time{min-width:80px}.stats span{font-size:11px}.assignment select{width:100%}}
  `;
}
window.customCards = window.customCards ?? [];
window.customCards.push({ type: "scheduler-plus-dashboard-card", name: "Scheduler+ Operations", description: "Day modes, live device states, and the next 24 hours or week." });

@customElement("scheduler-plus-dashboard-editor")
class SchedulerPlusDashboardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config: DashboardConfig = {};
  @state() private _modes: OperatingMode[] = [];
  @state() private _error = "";
  setConfig(config: DashboardConfig) { this._config = config; }
  protected override updated(changed: Map<string, unknown>) {
    if (changed.has("hass") && this.hass && !this._modes.length) {
      void fetchModes(this.hass).then(data => { this._modes = data.modes; }).catch(error => { this._error = formatApiError(error); });
    }
  }
  private _change(update: Partial<DashboardConfig>) {
    this._config = { ...this._config, ...update };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
  private _changePresets(value: string) {
    const names = value.split(",").map(name => name.trim()).filter(Boolean);
    // An empty box means "whatever the card ships with", not "no suggestions":
    // dropping the key entirely is what restores the defaults.
    this._change({ mode_presets: names.length ? names : undefined });
  }
  protected override render() {
    return html`<label>Dashboard title<input .value=${this._config.title ?? ""} @input=${(e: Event) => this._change({title: (e.target as HTMLInputElement).value})}></label>
      <label>Default view<select .value=${this._config.default_view ?? "24h"} @change=${(e: Event) => this._change({default_view: (e.target as HTMLSelectElement).value as DashboardView})}><option value="now">Now</option><option value="24h">Next 24 hours</option><option value="week">Next 7 days</option></select></label>
      <label><input type="checkbox" .checked=${this._config.show_devices !== false} @change=${(e: Event) => this._change({show_devices: (e.target as HTMLInputElement).checked})}>Show live devices</label>
      <h3>Suggested mode names</h3><p>Offered as one-tap starting points until the first mode exists. Comma separated; leave empty for the defaults.</p>
      <label><input .value=${(this._config.mode_presets ?? DEFAULT_MODE_PRESETS).join(", ")} @change=${(e: Event) => this._changePresets((e.target as HTMLInputElement).value)}></label>
      <h3>Visible mode controls</h3><p>All modes are shown by default. These choices only change the display.</p>
      ${this._error ? html`<p role="alert">${this._error}</p>` : nothing}
      ${this._modes.map(m => html`<label><input type="checkbox" .checked=${!this._config.modes || this._config.modes.includes(m.id)} @change=${(e: Event) => { const selected = this._config.modes ?? this._modes.map(mode => mode.id); this._change({ modes: (e.target as HTMLInputElement).checked ? [...selected, m.id] : selected.filter(id => id !== m.id) }); }}>${m.name}</label>`)}`;
  }
  static override styles = css`label{display:flex;align-items:center;gap:12px;margin:16px 0;font-size:14px}input,select{padding:10px;border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}input:not([type=checkbox]){flex:1;min-width:0}p{font-size:13px;color:var(--secondary-text-color)}`;
}
