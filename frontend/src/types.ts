/**
 * TypeScript types mirroring Scheduler+'s Python domain models
 * (custom_components/scheduler_plus/models.py, const.py). These are the
 * exact shapes that arrive over the websocket API as JSON.
 */

/**
 * "light" and "switch" are still valid values (schedules created before
 * the Light/Switch merge keep working, unmigrated), but are no longer
 * offered when creating a new schedule - see DEVICE_TYPES.
 */
export type DeviceType = "light" | "climate" | "switch" | "light_switch";

/** Selectable when creating a NEW schedule. */
export const DEVICE_TYPES: readonly DeviceType[] = ["light_switch", "climate"];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  light: "Light",
  climate: "Climate",
  switch: "Switch",
  light_switch: "Lights & Switches",
};

/**
 * The real Home Assistant entity domain(s) each DeviceType allows - used to
 * filter entity pickers. Not the same thing as DEVICE_TYPE_LABELS: e.g.
 * "light_switch" is a single schedule-level choice but spans two domains.
 */
export const DEVICE_TYPE_DOMAINS: Record<DeviceType, string[]> = {
  light: ["light"],
  climate: ["climate"],
  switch: ["switch"],
  light_switch: ["light", "switch"],
};

/** Every entity domain Scheduler+ supports, for pickers not tied to one schedule's device type. */
export const ALL_DEVICE_DOMAINS: readonly string[] = ["light", "climate", "switch"];

/**
 * Climate "on" HVAC modes a rule can select. "off" is deliberately
 * excluded - a rule's off_time already turns the entity off via
 * ClimateDeviceHandler.async_turn_off, so it's never a meaningful
 * on-action. This is a UI-only concern: the backend's ClimateDeviceHandler
 * forwards whatever string it's given straight to climate.set_hvac_mode
 * without validating it against this list. Shared between the rule editor
 * (to pick a mode) and the Day view report (to display one).
 */
export const CLIMATE_HVAC_MODES = [
  "heat",
  "cool",
  "heat_cool",
  "auto",
  "dry",
  "fan_only",
] as const;

export type ClimateHvacMode = (typeof CLIMATE_HVAC_MODES)[number];

export const CLIMATE_HVAC_MODE_LABELS: Record<ClimateHvacMode, string> = {
  heat: "Heat",
  cool: "Cool",
  heat_cool: "Heat/Cool",
  auto: "Auto",
  dry: "Dry",
  fan_only: "Fan only",
};

export type TimeProviderType = "fixed" | "sunrise" | "sunset" | "yidcal";

export const TIME_PROVIDER_TYPES: readonly TimeProviderType[] = [
  "fixed",
  "sunrise",
  "sunset",
  "yidcal",
];

export const TIME_PROVIDER_LABELS: Record<TimeProviderType, string> = {
  fixed: "Fixed time",
  sunrise: "Sunrise",
  sunset: "Sunset",
  yidcal: "YidCal",
};

/**
 * YidCal zmanim (halachic times) selectable when a Rule's on_time/off_time
 * provider is "yidcal", via TimeSpec.params.zman. Every value here has a
 * registered backend entity - see time_providers/__init__.py.
 */
export type YidcalZmanType = "candle_lighting" | "motzei_shabbos";

export const YIDCAL_ZMAN_TYPES: readonly YidcalZmanType[] = [
  "candle_lighting",
  "motzei_shabbos",
];

export const YIDCAL_ZMAN_LABELS: Record<YidcalZmanType, string> = {
  candle_lighting: "הדלקות הנירות",
  motzei_shabbos: 'מוצש"ק',
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
  /** Whether the engine acts on each side - a rule can be on-only or off-only, but not neither. */
  on_enabled: boolean;
  off_enabled: boolean;
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
  /**
   * Seasonal active window, e.g. "Jul 1-Aug 31 only" - independent of each
   * rule's own date_mode/dates/date_ranges. See Schedule.is_active_on's
   * docstring in models.py for why this is schedule-level and range-only.
   */
  active_date_mode: RuleDateMode;
  active_date_ranges: [string, string][];
  /** Manager-triggered pause, "YYYY-MM-DD" (paused through and including this date) or null. */
  override_until: string | null;
  /** Whether the schedule's seasonal window (if any) currently includes today - server-computed. */
  active_now: boolean;
  /** Soonest upcoming date active_date_ranges turns the schedule on, if currently inactive. */
  next_active_date: string | null;
}
