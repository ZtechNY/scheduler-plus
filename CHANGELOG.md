# Changelog

All notable changes to Scheduler+ are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versions follow [Semantic Versioning](https://semver.org/).

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
