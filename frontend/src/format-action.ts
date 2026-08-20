import type { DeviceType } from "./types";
import { CLIMATE_HVAC_MODE_LABELS } from "./types";

/**
 * Describes what an "on" action actually does, e.g. "Heat · 70°" or
 * "Brightness 60%". Returns undefined when the action has nothing worth
 * calling out (a switch, or a light/climate rule with no extra params set)
 * - callers fall back to a bare "On" in that case. Shared between the Day
 * view report (per specific occurrence) and the card's "Next:" line (see
 * scheduler-plus-card.ts's climateOnDescription).
 */
export function formatAction(
  deviceType: DeviceType,
  action: Record<string, unknown>,
): string | undefined {
  if (deviceType === "light") {
    const parts: string[] = [];
    if (typeof action.brightness === "number") {
      parts.push(`Brightness ${Math.round((action.brightness / 255) * 100)}%`);
    }
    if (typeof action.transition === "number" && action.transition > 0) {
      parts.push(`fade ${action.transition}s`);
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }
  if (deviceType === "climate") {
    const parts: string[] = [];
    if (typeof action.hvac_mode === "string") {
      const labels: Record<string, string> = CLIMATE_HVAC_MODE_LABELS;
      parts.push(labels[action.hvac_mode] ?? action.hvac_mode);
    }
    if (typeof action.target_temperature === "number") {
      parts.push(`${action.target_temperature}°`);
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  }
  return undefined;
}
