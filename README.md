# Scheduler+

Scheduler+ is a Home Assistant scheduling engine for creating and managing time-based automations from a Lovelace card. It supports lights, switches, climate devices, sun-based times, YidCal dates, holidays, and flexible rules.

## Features

- Create, edit, pause, resume, and remove schedules from the Home Assistant UI.
- Run actions for lights, switches, and climate entities.
- Use fixed times, sunrise, sunset, and YidCal-based time providers.
- Add date, weekday, holiday, and active-period conditions to rules.
- Schedule one-time events or recurring rules.
- Review schedules in day and week views and detect conflicting events.
- Customize weekday/weekend presets, working hours, brightness, and fade-in options.

## Requirements

- Home Assistant **2024.8.0** or newer.
- HACS, if installing from the custom repository.

## Installation with HACS

1. Open **HACS** in Home Assistant.
2. Open **Integrations**, select **More (three dots) -> Custom repositories**, and add this repository as an **Integration** if it is not already listed.
3. Search for **Scheduler+** and install it.
4. Restart Home Assistant.
5. Go to **Settings -> Devices & services -> Add integration**, search for **Scheduler+**, and complete the setup.

Scheduler+ uses a single configuration entry. Schedules are created and managed after setup through the Scheduler+ card; no host, account, or API credentials are required.

## Adding the card

After installing the integration, add the Scheduler+ card to a dashboard:

```yaml
type: custom:scheduler-plus-card
```

## Report card

A separate card for reviewing entity history: pick any set of entities and a date range and see what actually happened to them (state and attribute history, e.g. climate actual/target temperature or light/switch on-off), on screen or as a downloadable PDF. Each change is annotated as caused by a Scheduler+ rule (naming the rule and schedule) or by something else, when Home Assistant's recorder/logbook have the history to tell. Independent of the main Scheduler+ card - add it to any dashboard on its own:

```yaml
type: custom:scheduler-plus-report-card
```

## Basic usage

1. Open the Scheduler+ card and create a schedule.
2. Add one or more rules, choosing when the rule should run.
3. Select the target entity and configure its action, for example, turning on a light or setting a climate temperature.
4. Save the schedule, then use the card to pause, resume, or edit it.

For detailed examples and screenshots, see the [printable Scheduler+ User Guide](docs/scheduler-plus-guide.pdf).

## Configuration options

Open **Settings -> Devices & services -> Scheduler+ -> Configure** to set weekday and weekend presets, working-hours start and end times, and whether light rules show brightness and fade-in controls.

## License

Scheduler+ is released under the [MIT License](LICENSE).

## Operating modes and dashboard

Switch to **Modes** in the main card's header, or add **Scheduler+ Operations**
from Home Assistant's card picker. This is built into Scheduler+; it does not
require the separate Schedule Modes integration.

1. Create your regular and special schedules using the existing schedule editor.
   Keep new special schedules paused until they have been assigned to a mode.
2. Choose **Create mode**, name it, and select which schedules it should **Run only
   in this mode** and which it should **Skip while mode is on**.
3. Optionally select weekly repeat days. Leave these blank for occasional events.
4. Save, then enable the special schedules in the main card. Their mode now controls
   which dates they can run on.
5. On the dashboard, pick a date and switch each mode on or off. A date choice
   overrides the weekly routine; **Use weekly routine** removes that date override.

Examples:

| Mode | Skip | Run only in this mode |
| --- | --- | --- |
| No school | Regular school lights and HVAC | Optional building setback schedule |
| Short day | Regular school schedules | School lights/HVAC with an earlier end time |
| Chasunah | Any conflicting regular hall schedule | Hall lights until the next morning; seasonal HVAC from 3 PM |
| Friday night Tish | Regular Friday hall lighting | Friday evening lights through the configured Saturday end time |
| Rabbi here / Rabbi away | Select the routines that should not run | Corresponding lighting routines |

Modes gate an entire schedule by the rule occurrence's **starting date**. An
on-window ending after midnight retains its morning end time even though the
mode is off on the following date. Schedule weekdays, seasonal ranges, pauses,
and rule date filters continue to apply. For winter/summer actions, assign separate
seasonally restricted schedules to the same mode. Weekly repeats have no end date;
use explicit date overrides for exceptions.

A schedule assigned to Run in several modes runs when **any** of those modes is
on. **Skip wins** if another active mode blocks that schedule. Modes are independent;
Rabbi here and Rabbi away are not automatically mutually exclusive.

Changing today's mode recalculates schedules immediately, including catching up an
active on-window. Skipping cancels remaining scheduled actions; it **does not turn
off equipment already running**. Configure a replacement schedule with an explicit
early off action when needed. Removing a schedule's last Run assignment (including
deleting its mode) pauses that schedule so it cannot accidentally become an everyday
routine; the dashboard names each schedule it paused. Deleting a mode also removes
its Skip effects.

Date choices for dates that have passed are cleaned up automatically. Yesterday is
kept, so an event that runs past midnight still has its morning off action.

The overlap check in the schedule editor takes modes into account, so two schedules
that can never run on the same day are not reported as conflicting. It is a snapshot
of the modes in force when you save: switching a mode on later can create an overlap
that check did not list.

The dashboard shows current scheduled windows, actual device states, and planned
actions for the next 24 hours or seven days. Forecasts respect modes and use the Home
Assistant timezone. Scheduled activity is a plan, not proof that a device acted;
use live states and the Report card to check actual operation. Data refreshes after
every mode change, and every 30 seconds while the tab is open - a dashboard left in a
background tab stops polling until you return to it.

### Modes in automations

Each mode gets a `binary_sensor` that is on for as long as the mode is on today,
so modes are usable outside the card - in automation conditions, templates,
dashboards, and history. Its attributes carry `source` (`date` when today was
chosen explicitly, `weekly` when it came from the weekly repeat), `weekdays`,
`run_schedules`, and `skip_schedules`.

`scheduler_plus.set_mode` turns a mode on or off from anywhere in Home Assistant -
a calendar trigger, a dashboard button, a script, a voice assistant:

```yaml
action: scheduler_plus.set_mode
data:
  mode: No school        # the mode's name, as shown on the dashboard
  state: "on"            # "on", "off", or "auto" to follow the weekly repeat
  date: "2026-09-25"     # optional; defaults to today
```

An unknown mode name fails the action rather than doing nothing quietly, so a
typo shows up in the automation trace.

### Dashboard card options

Use the dashboard's visual card editor to set its title, default outlook, visible
mode controls, suggested mode names, and whether live devices are shown. YAML is
also supported:

```yaml
type: custom:scheduler-plus-dashboard-card
title: School operations
default_view: 24h # now, 24h, or week
show_devices: true
# Optional: show only these mode IDs (display filter, not an execution filter)
# modes:
#   - your_mode_id
# Optional: the one-tap name suggestions offered before the first mode exists
# mode_presets:
#   - No school
#   - Bris
```

Modes and date choices persist across Home Assistant restarts. Existing schedules
continue to behave as before until assigned to a mode. After updating the integration,
restart Home Assistant and refresh the browser to load the rebuilt card bundle.
