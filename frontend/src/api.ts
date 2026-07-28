/**
 * Thin typed wrapper around Home Assistant's websocket API for Scheduler+'s
 * own commands. Nothing outside this file should construct a
 * `hass.callWS()` message directly.
 */

import type { Action, DeviceType, Rule, RuleDateMode, Schedule, Weekday } from "./types";

/** The minimal shape of one entity's state, as found in `hass.states`. */
export interface HassEntityState {
  state: string;
  attributes: Record<string, unknown>;
}

/**
 * The slice of Home Assistant's frontend `hass` object this card depends
 * on. Deliberately minimal: Home Assistant does not publish a small
 * standalone types package, so this interface only grows as the card
 * actually needs more of `hass`'s surface, rather than copying its entire
 * (large) real shape up front. `states` is keyed directly by entity_id (no
 * entity-registry lookup needed), unlike the `hass.entities` reverse
 * lookup this card used to depend on for the next-event feature and no
 * longer does.
 */
export interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  states: Record<string, HassEntityState>;
}

const DOMAIN = "scheduler_plus";

/** A rule as submitted to create/update_schedule: `id` is optional, filled in by the server for new rules. */
export type RuleInput = Omit<Rule, "id"> & { id?: string };

export interface ScheduleInput {
  name: string;
  device_type: Schedule["device_type"];
  entities: string[];
  enabled?: boolean;
  rules?: RuleInput[];
  active_date_mode?: RuleDateMode;
  active_date_ranges?: [string, string][];
  override_until?: string | null;
}

/**
 * Maps an existing Schedule back into an update_schedule payload, carrying
 * every field forward unchanged. update_schedule always replaces the whole
 * schedule, so a call site that wants to change just one field (the card's
 * quick-toggle, the pause dialog) must still resend every other field -
 * hand-picking a field list at each such call site is how a newly added
 * Schedule field silently gets dropped the next time that call site fires.
 */
export function toScheduleInput(schedule: Schedule): ScheduleInput {
  return {
    name: schedule.name,
    device_type: schedule.device_type,
    entities: schedule.entities,
    enabled: schedule.enabled,
    rules: schedule.rules,
    active_date_mode: schedule.active_date_mode,
    active_date_ranges: schedule.active_date_ranges,
    override_until: schedule.override_until,
  };
}

export async function fetchSchedules(hass: HomeAssistant): Promise<Schedule[]> {
  const result = await hass.callWS<{ schedules: Schedule[] }>({
    type: `${DOMAIN}/list_schedules`,
  });
  return result.schedules;
}

export async function createSchedule(
  hass: HomeAssistant,
  input: ScheduleInput,
): Promise<Schedule> {
  const result = await hass.callWS<{ schedule: Schedule }>({
    type: `${DOMAIN}/create_schedule`,
    ...input,
  });
  return result.schedule;
}

export async function updateSchedule(
  hass: HomeAssistant,
  scheduleId: string,
  input: ScheduleInput,
): Promise<Schedule> {
  const result = await hass.callWS<{ schedule: Schedule }>({
    type: `${DOMAIN}/update_schedule`,
    schedule_id: scheduleId,
    ...input,
  });
  return result.schedule;
}

export async function deleteSchedule(
  hass: HomeAssistant,
  scheduleId: string,
): Promise<void> {
  await hass.callWS({
    type: `${DOMAIN}/delete_schedule`,
    schedule_id: scheduleId,
  });
}

/**
 * The signed-in user's own weekday/weekend/working-hours split, used by
 * the rule editor to power its Weekdays/Weekend/After hours quick-fill
 * presets. Each Home Assistant user has their own (set via
 * updatePreferences/"My preferences" on the card); a user who hasn't set
 * one yet gets the admin-configured fallback from Scheduler+'s options
 * flow (Settings > Devices & Services > Scheduler+ > Configure) instead.
 */
export interface Preferences {
  weekday_days: Weekday[];
  weekend_days: Weekday[];
  working_hours_start: string;
  working_hours_end: string;
}

export async function fetchPreferences(hass: HomeAssistant): Promise<Preferences> {
  return hass.callWS<Preferences>({ type: `${DOMAIN}/get_preferences` });
}

export async function updatePreferences(
  hass: HomeAssistant,
  preferences: Preferences,
): Promise<Preferences> {
  return hass.callWS<Preferences>({
    type: `${DOMAIN}/set_preferences`,
    ...preferences,
  });
}

/** One rule's on/off occurrence on a specific date, for the read-only Day view report. */
export interface DayScheduleEvent {
  schedule_id: string;
  schedule_name: string;
  device_type: DeviceType;
  entities: string[];
  rule_id: string;
  rule_name: string;
  action: Action;
  on_at: string | null;
  off_at: string | null;
}

export async function fetchDaySchedule(
  hass: HomeAssistant,
  date: string,
  deviceType?: DeviceType,
): Promise<DayScheduleEvent[]> {
  const result = await hass.callWS<{ events: DayScheduleEvent[] }>({
    type: `${DOMAIN}/get_day_schedule`,
    date,
    ...(deviceType ? { device_type: deviceType } : {}),
  });
  return result.events;
}

/** One day's worth of events, as returned by fetchWeekSchedule. */
export interface WeekScheduleDay {
  date: string;
  events: DayScheduleEvent[];
}

export async function fetchWeekSchedule(
  hass: HomeAssistant,
  startDate: string,
  deviceType?: DeviceType,
): Promise<WeekScheduleDay[]> {
  const result = await hass.callWS<{ days: WeekScheduleDay[] }>({
    type: `${DOMAIN}/get_week_schedule`,
    start_date: startDate,
    ...(deviceType ? { device_type: deviceType } : {}),
  });
  return result.days;
}

/**
 * A reusable, entity-agnostic set of rules a manager can apply to a new
 * schedule ("Save as template" / "New from template"). Has no
 * entities/enabled of its own - see ScheduleTemplate in models.py.
 */
export interface ScheduleTemplate {
  id: string;
  name: string;
  device_type: DeviceType;
  rules: Rule[];
}

export interface TemplateInput {
  name: string;
  device_type: DeviceType;
  rules?: RuleInput[];
}

export async function fetchTemplates(hass: HomeAssistant): Promise<ScheduleTemplate[]> {
  const result = await hass.callWS<{ templates: ScheduleTemplate[] }>({
    type: `${DOMAIN}/list_templates`,
  });
  return result.templates;
}

export async function createTemplate(
  hass: HomeAssistant,
  input: TemplateInput,
): Promise<ScheduleTemplate> {
  const result = await hass.callWS<{ template: ScheduleTemplate }>({
    type: `${DOMAIN}/create_template`,
    ...input,
  });
  return result.template;
}

export async function deleteTemplate(hass: HomeAssistant, templateId: string): Promise<void> {
  await hass.callWS({
    type: `${DOMAIN}/delete_template`,
    template_id: templateId,
  });
}

export async function createScheduleFromTemplate(
  hass: HomeAssistant,
  templateId: string,
  name: string,
  entities: string[],
): Promise<Schedule> {
  const result = await hass.callWS<{ schedule: Schedule }>({
    type: `${DOMAIN}/create_schedule_from_template`,
    template_id: templateId,
    name,
    entities,
  });
  return result.schedule;
}
