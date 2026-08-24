# Changelog

All notable changes to Scheduler+ are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [0.2.0] - Unreleased

### Added

- Report view: pick any set of entities and a date range and see what actually happened to them (state and attribute history, e.g. climate actual/target temperature or light/switch on-off), on screen or as a downloadable PDF. Each change is annotated as caused by a Scheduler+ rule (naming the rule and schedule) or by something else, when Home Assistant's recorder/logbook have the history to tell.

## [0.1.2] - 2026-08-20

### Added

- Initial Scheduler+ Home Assistant integration.
- Lovelace scheduling card with schedule and rule editing.
- Light, switch, and climate actions.
- Fixed-time, sunrise, sunset, and YidCal time providers.
- Weekday, holiday, date, and active-period conditions.
