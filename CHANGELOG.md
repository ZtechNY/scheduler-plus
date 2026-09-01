# Changelog

All notable changes to Scheduler+ are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versions follow [Semantic Versioning](https://semver.org/).

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
