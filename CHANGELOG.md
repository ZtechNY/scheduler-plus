# Changelog

All notable changes to Scheduler+ are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [0.6.5] - 2026-11-20

### Fixed

- Show activity timestamps in PDF reports in the Home Assistant site time
  zone, including daylight saving time and changes of date at midnight.

## [0.6.4] - 2026-11-20

### Added

- Add an installation-level **Skip late thermostat starts** setting (off by
  default). Skip missed thermostat starts, failed start retries, and late
  starts from weather changes or override enforcement. Scheduled commands
  and missed shutoff recovery still run. This is not a compressor interlock.

## [0.6.3] - 2026-11-20

### Changed

- Title PDF exports **Device Activity Report**, with a larger report logo and
  dates in MM/DD/YYYY format.
- Show friendly device labels in PDF tables without raw entity IDs. Keep
  devices with identical display names distinguishable.

## [0.6.2] - 2026-11-20

### Added

- Give all PDF reports from this Home Assistant installation an optional logo
  under **Settings → Devices & Services → Scheduler+ → Configure → Report branding**.
  Every PDF page credits Ztech Solutions.

### Changed

- PDF reports show thermostat target changes before and after and label
  measured room temperature separately, using the Home Assistant temperature unit.
- Reports open with a recap, and long device tables repeat the device and column
  headings on continuation pages.

### Fixed

- Keep the PDF download link available for the Home Assistant Android app to save.
- Keep Scheduler+ settings usable on older Home Assistant options-flow versions.

## [0.6.1] - 2026-11-15

### Added

- Climate rules with a Time plan can give each period its own temperature, so
  one rule covers a whole day (e.g. 68° in the morning, 72° during the day, 70°
  in the evening). A period left blank uses the rule's target temperature. The
  schedule summary and Day view show each period's temperature.

### Changed

- Time plan periods that meet (one ends at 9:00, the next starts at 9:00) now
  hand straight over instead of turning the device off and back on at the same
  moment.

### Fixed

- Eco setback sent the rule's normal action again at the Off time instead of
  the setback temperature.
- Switches in the rule and schedule editors were missing their labels.

## [0.6.0] - 2026-11-15

### Added

- Climate rules can depend on the outdoor temperature: "only turn on when outside
  is at or below 45°F" (or at or above). The On time is skipped when the weather
  doesn't match; the Off time always runs. With "Keep watching during the On-Off
  window", the rule also turns on as soon as it gets cold enough during the
  window and back off once it is a set buffer (default 2°) past the setting.
- Choose the outdoor temperature sensor under Settings > Devices & services >
  Scheduler+ > Configure (a temperature sensor, such as a Honeywell thermostat's
  Outdoor temperature, or a weather entity). A rule can use a different sensor.
- If the sensor has no reading (unavailable or not set), the rule runs as
  scheduled. While watching, an unavailable reading is ignored and the last
  decision stands.
- Day view shows a rule's outdoor condition.

## [0.5.5] - 2026-11-06

### Fixed

- Many devices switching at the same moment (a startup catch-up, or a busy time
  like 06:00) no longer time out together. Device calls now go to each integration
  one at a time (four at a time for thermostats), and the timeout only starts once
  a call actually runs, not while it waits for its turn.
- Thermostats get 60 seconds per change instead of 15, since cloud thermostats
  (Honeywell Total Connect Comfort and similar) are often slow to accept one.
- A failed on/off no longer creates a notification or an error with a traceback
  straight away. The first two failed attempts log a one-line warning; the
  notification appears only if the third attempt (about 3 minutes later) also
  fails. Failures of override reverts and manual auto-off still notify at once.

## [0.5.4] - 2026-11-02

### Fixed

- A missed off is no longer lost when an outage crosses midnight: catch-up now
  considers every rule's events from the last 24 hours (plus any window still
  open), and each device gets its most recent one. As a result, a restart can
  re-send yesterday's last on/off, as it already did for today's.
- A failed on/off is retried after 1, 2 and 5 minutes, then every 10 minutes, until
  it succeeds, a newer event for that device is sent, or 6 hours pass. Rescans no
  longer treat a failed action as done.
- Shabbos and the last day of Yom Tov now end at havdalah (YidCal's motzi sensor, or
  sunset plus YidCal's havdalah offset), so "skip Shabbos" rules run on Saturday
  night. The candle-lighting fallback uses YidCal's configured offset too.
- A rule from candle lighting to motzei Shabbos now works, including across a
  multi-day Yom Tov and Shabbos block. When YidCal's sensors don't report the day
  needed, candle lighting and motzei Shabbos are computed from the calendar and
  sunset (before sunset on the eve of Shabbos, after nightfall from one holy day
  into the next). A rule that should run but whose time can't be resolved is now
  logged once per day.

## [0.5.3] - 2026-11-01

### Fixed

- Off-only rules timed before 6:00 AM now fire that morning instead of the next day,
  and on-only rules no longer fail because their unused off time can't be resolved.
- After a restart or outage, each device is set to the state of its most recent
  scheduled on *or* off today, so a missed off is no longer skipped. The catch-up
  waits until Home Assistant has fully started, runs again a minute later for slow
  devices, and runs each device in the background with a 15-second limit per call.
- Rescans (edits, midnight) no longer re-send actions already sent, so manual
  changes are kept; editing a rule still brings its devices up to date.
- Shabbos and Yom Tov are decided per date from the Hebrew calendar, with Friday or
  Erev Yom Tov evening counting from candle lighting. Friday-night Shabbos rules now
  run, Shabbos windows past midnight keep their off, and "skip Yom Tov" overnight
  rules stay off on the second day. Rules also re-evaluate when YidCal's zman
  sensors change.
- Missing devices and YidCal sensors are logged and shown in Repairs instead of
  being ignored silently.
- Overlapping rescans can no longer leave a deleted or disabled rule's timers behind,
  and one unreadable stored schedule no longer stops the others from running.
- Times skipped by the spring DST change now fire once, right after the jump; times
  repeated in the fall fire once.

## [0.5.2] - 2026-10-20

### Fixed

- Pending callbacks are now canceled when a schedule or one of its rules is deleted,
  so removed schedules cannot trigger later.

## [0.5.1] - 2026-10-16

### Fixed

- Time plans now support multiple independent start/end periods, such as
  8:00–8:20 AM and 10:32–10:55 AM, instead of assuming one repeating duration.

## [0.5.0] - 2026-10-16

### Added

- Time plans with exact minute-based on/off durations inside a scheduled window.
- Manual light auto-off timers that turn off a manually activated light after a configurable delay.

## [0.4.2] - 2026-10-05

### Changed

- Mode setup initially shows a smaller set of device actions, with search and a
  Show all option for larger installations.

## [0.4.0] - 2026-09-22

### Added

- Operating modes: name a kind of day ("No school", "Chasunah", "Friday night Tish"),
  then set which schedules run only on those days and which are skipped. Modes repeat
  weekly, are pinned to individual dates, or both, and gate a schedule by the date its
  window starts on - so an event running past midnight keeps its morning off action.
- An operations dashboard, reachable from the main card's header or as its own
  **Scheduler+ Operations** card: day modes, live device states, and the next 24 hours
  or seven days.
- One `binary_sensor` per mode, on while that mode is on today, with attributes for
  why it is on and which schedules it affects - so modes work in automations,
  templates, and history, not just in the card.
- `scheduler_plus.set_mode` service, to turn a mode on or off for a date (or release
  that date back to the weekly repeat) from an automation, script, or dashboard button.
  An unknown mode name fails the action rather than doing nothing.
- The dashboard now names any schedule a mode change paused, instead of pausing it
  silently.

### Changed

- A schedule's "resumes on" date accounts for operating modes as well as its seasonal
  window, so it no longer promises a date a mode will block.
- The schedule editor's overlap check ignores pairs of schedules that modes keep apart,
  and says so alongside the results.
- Suggested mode names are configurable per dashboard card (`mode_presets`).
- The dashboard fetches only the days the selected outlook shows, and stops polling
  while its tab is in the background.

### Fixed

- Mode date choices for dates that have passed are cleaned up rather than accumulating
  in storage for the life of the install.
- Saving a mode from a form left open no longer overwrites date toggles made in the
  meantime; the save is rejected and asks you to reopen it.

## [0.3.5] - 2026-09-17

### Added

- Home Assistant notifications for failed scheduled device actions, including schedule, rule, device, action, time, and error. Repeated failures update the same rule/device notification; notices remain until dismissed.

### Fixed

- Catch device action failures during scheduled runs, catch-up, and override reapplication so they are reported and do not interrupt dispatch to other devices.

## [0.3.4] - 2026-09-16

### Fixed

- Make override listener cleanup safe to repeat, preventing midnight refresh failures and missed next-day schedule runs after a rule turns off or is replaced.

## [0.3.1] - 2026-09-01

### Added

- Report card: points are now grouped by day in the list, with a per-day header showing how many changes that day had.

### Changed

- Schedule create/update/delete and template creation no longer require Home Assistant administrator permission - any signed-in user can now manage schedules through the card.
- Frontend error messages (schedule save/conflict-check failures) go through a shared formatter for more consistent, readable text.

## [0.3.0] - 2026-08-25

### Added

- New standalone Report card (`type: custom:scheduler-plus-report-card`), addable to any dashboard on its own - same entity picker, date range, chart, table, and PDF export as before, now in a normal card instead of a dialog.

### Removed

- The Report icon/dialog on the main Scheduler+ card - the feature moved entirely to the new Report card above; it no longer lives inside the scheduling card.

## [0.2.3] - 2026-08-24

### Fixed

- Report PDF: row text was invisible (white-on-white/light) because the header row's white text color was never reset before drawing the data rows below it.

### Changed

- Report PDF layout redesigned: hairline row separators and color-coded text instead of a busy full grid with colored cell fills, a page-number footer on every page, and a redrawn column header when an entity's table spans multiple pages.

## [0.2.2] - 2026-08-24

### Changed

- Report view's list/PDF rows: only a genuine change (target temperature, hvac mode/action, or on-off) gets its own row now, instead of every routine ambient-temperature reading - those are still fully visible as the continuous chart line, just no longer repeated as near-identical rows underneath it.
- Report view's row wording: attributes are now described in plain language ("Target 69° · Room 71° · Cooling", "Brightness 80%") instead of raw `key=value` pairs, and applied identically to both the on-screen list and the PDF.

## [0.2.1] - 2026-08-24

### Fixed

- Report view's PDF download: authenticate with the signed-in user's access token instead of relying on a same-origin cookie, which wasn't enough on its own.
- Report view's climate chart: actual and target temperature now share one y-axis scale, instead of each being normalized independently (which could put a near-constant target line somewhere unrelated to the actual line).

### Added

- Report view's climate chart: y-axis min/max labels, gridlines, and a hover tooltip showing the exact actual/target temperature (and time) at the point under the cursor.

## [0.2.0] - 2026-08-24

### Added

- Report view: pick any set of entities and a date range and see what actually happened to them (state and attribute history, e.g. climate actual/target temperature or light/switch on-off), on screen or as a downloadable PDF. Each change is annotated as caused by a Scheduler+ rule (naming the rule and schedule) or by something else, when Home Assistant's recorder/logbook have the history to tell.

## [0.1.2] - 2026-08-20

### Added

- Initial Scheduler+ Home Assistant integration.
- Lovelace scheduling card with schedule and rule editing.
- Light, switch, and climate actions.
- Fixed-time, sunrise, sunset, and YidCal time providers.
- Weekday, holiday, date, and active-period conditions.
