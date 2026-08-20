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
