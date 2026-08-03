import type { HomeAssistant, ScheduleConflict } from "./api";
import { fetchSchedules, toScheduleInput, updateSchedule } from "./api";

/** Renders an ISO datetime's time portion, e.g. "6:00 AM". */
function formatConflictTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Renders a "YYYY-MM-DD" string as e.g. "Aug 15". */
function formatConflictDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * A human-readable one-line summary of a conflict, e.g.
 * `Overlaps "Regular Hours" -> "Daily lights" on Aug 15, 9:00 AM - 4:00 PM`.
 */
export function describeConflict(conflict: ScheduleConflict): string {
  return (
    `Overlaps "${conflict.conflicting_schedule_name}" -> "${conflict.conflicting_rule_name}" ` +
    `on ${formatConflictDate(conflict.date)}, ` +
    `${formatConflictTime(conflict.conflicting_on_at)} - ${formatConflictTime(conflict.conflicting_off_at)}`
  );
}

/**
 * Excludes `conflict.date` from the conflicting rule and saves that OTHER
 * schedule - the one-click fix offered for a fixable conflict. Fetches the
 * conflicting schedule fresh rather than trusting anything cached from the
 * original check, since it may have changed (or been deleted) in the
 * meantime; throws a clear error rather than silently no-op'ing if the
 * schedule or rule can no longer be found.
 */
export async function excludeConflictDate(
  hass: HomeAssistant,
  conflict: ScheduleConflict,
): Promise<void> {
  const schedules = await fetchSchedules(hass);
  const schedule = schedules.find((s) => s.id === conflict.conflicting_schedule_id);
  if (!schedule) {
    throw new Error(`"${conflict.conflicting_schedule_name}" no longer exists.`);
  }

  let found = false;
  const rules = schedule.rules.map((rule) => {
    if (rule.id !== conflict.conflicting_rule_id) {
      return rule;
    }
    found = true;
    if (rule.date_mode === "include") {
      return { ...rule, dates: rule.dates.filter((d) => d !== conflict.date) };
    }
    return {
      ...rule,
      date_mode: "exclude" as const,
      dates: rule.dates.includes(conflict.date) ? rule.dates : [...rule.dates, conflict.date],
    };
  });
  if (!found) {
    throw new Error(`"${conflict.conflicting_rule_name}" no longer exists.`);
  }

  await updateSchedule(hass, schedule.id, { ...toScheduleInput(schedule), rules });
}
