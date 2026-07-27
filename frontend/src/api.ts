/**
 * Thin typed wrapper around Home Assistant's websocket API for Scheduler+'s
 * own commands. Nothing outside this file should construct a
 * `hass.callWS()` message directly.
 */

import type { Rule, Schedule } from "./types";

/**
 * The slice of Home Assistant's frontend `hass` object this card depends
 * on. Deliberately minimal: Home Assistant does not publish a small
 * standalone types package, so this interface only grows as the card
 * actually needs more of `hass`'s surface, rather than copying its entire
 * (large) real shape up front.
 */
export interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
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
