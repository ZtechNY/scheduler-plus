/**
 * TypeScript types mirroring Scheduler+'s Python domain models
 * (custom_components/scheduler_plus/models.py, const.py). These are the
 * exact shapes that arrive over the websocket API as JSON.
 */

export type DeviceType = "light" | "climate" | "switch";

export const DEVICE_TYPES: readonly DeviceType[] = ["light", "climate", "switch"];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  light: "Light",
  climate: "Climate",
  switch: "Switch",
};

export type TimeProviderType = "fixed" | "sunrise" | "sunset" | "yidcal";

export const TIME_PROVIDER_TYPES: readonly TimeProviderType[] = [
  "fixed",
  "sunrise",
  "sunset",
];

export const TIME_PROVIDER_LABELS: Record<TimeProviderType, string> = {
  fixed: "Fixed time",
  sunrise: "Sunrise",
  sunset: "Sunset",
  yidcal: "YidCal",
};

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: readonly Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** Opaque, provider-specific resolution parameters (e.g. {"time": "06:00"}). */
export type TimeParams = Record<string, unknown>;

export interface TimeSpec {
  provider: TimeProviderType;
  params: TimeParams;
}

/** Opaque, device-specific action parameters (e.g. {"brightness": 255}). */
export type Action = Record<string, unknown>;

/**
 * How a Rule's `dates` list constrains which days it's active on.
 * "always": `dates` is ignored - the rule follows `days` alone, every week.
 * "include": the rule ignores `days` entirely and only fires on the exact
 *   dates listed - a one-off/holiday-style rule.
 * "exclude": the rule follows `days` as usual, except it's skipped
 *   entirely on any listed date - an override/blackout for an otherwise-
 *   recurring rule.
 */
export type RuleDateMode = "always" | "include" | "exclude";

export const RULE_DATE_MODES: readonly RuleDateMode[] = ["always", "include", "exclude"];

export const RULE_DATE_MODE_LABELS: Record<RuleDateMode, string> = {
  always: "Always",
  include: "Only on these dates",
  exclude: "Except these dates",
};

/**
 * YidCal-backed day-type conditions a Rule's date filter can reference, as
 * an alternative to listing literal dates - e.g. "except every Yom Tov"
 * instead of maintaining a Yom Tov date list by hand.
 */
export type DayConditionType = "shabbos" | "yom_tov" | "erev_shabbos" | "erev_yom_tov";

/** Selectable in the rule editor - every DayConditionType now has a registered plugin. */
export const DAY_CONDITION_TYPES: readonly DayConditionType[] = [
  "shabbos",
  "yom_tov",
  "erev_shabbos",
  "erev_yom_tov",
];

export const DAY_CONDITION_LABELS: Record<DayConditionType, string> = {
  shabbos: "Shabbos",
  yom_tov: "Yom Tov",
  erev_shabbos: "Erev Shabbos",
  erev_yom_tov: "Erev Yom Tov",
};

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  days: Weekday[];
  date_mode: RuleDateMode;
  dates: string[];
  /** [start, end] pairs of "YYYY-MM-DD" strings, inclusive on both ends. */
  date_ranges: [string, string][];
  day_conditions: DayConditionType[];
  on_time: TimeSpec;
  off_time: TimeSpec;
  action: Action;
}

export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  device_type: DeviceType;
  entities: string[];
  rules: Rule[];
  /** Soonest upcoming on/off moment across all of this schedule's rules, computed server-side. */
  next_event: string | null;
  next_event_action: "on" | "off" | null;
}
