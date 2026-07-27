/**
 * TypeScript types mirroring Scheduler+'s Python domain models
 * (custom_components/scheduler_plus/models.py, const.py). These are the
 * exact shapes that arrive over the websocket API as JSON.
 */

export type DeviceType = "light" | "climate";

export const DEVICE_TYPES: readonly DeviceType[] = ["light", "climate"];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  light: "Light",
  climate: "Climate",
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

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  days: Weekday[];
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
}
