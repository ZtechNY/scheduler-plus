"""PDF presentation and the existing authenticated download view, with local fixtures."""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from unittest.mock import AsyncMock

from aiohttp import FormData

import pytest
from PIL import Image
from homeassistant.components.config.config_entries import (
    OptionManagerFlowIndexView,
    OptionManagerFlowResourceView,
)
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_test_home_assistant

from custom_components.scheduler_plus import report_view
from custom_components.scheduler_plus.const import DOMAIN
from custom_components.scheduler_plus.report_branding import (
    ReportLogoStore,
    async_get_site_logo,
    decode_report_logo,
    report_logo_store,
)
from custom_components.scheduler_plus.report import EntityReport, ReportData, ReportPoint
from custom_components.scheduler_plus.report_view import SchedulerPlusReportPdfView

_DAY = date(2026, 1, 12)
_URL = f"{SchedulerPlusReportPdfView.url}?entities=light.example&start={_DAY}&end={_DAY}"
_SETTINGS = "/api/config/config_entries/options/flow"
_FOOTER = b"Powered by Ztech Solutions"


def _report(row_count: int) -> ReportData:
    start = datetime(2026, 1, 12, 8, tzinfo=timezone.utc)
    return ReportData(start_date=_DAY, end_date=_DAY, entities=[EntityReport(
        entity_id="light.example", domain="light", friendly_name="Example hall",
        points=[ReportPoint(
            at=start + timedelta(minutes=i), state="on" if i % 2 else "off",
            attributes={"brightness": 153}, source="other",
        ) for i in range(row_count)],
    )])


def _png(width: int, height: int, color: str) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (width, height), color).save(buffer, "PNG")
    return buffer.getvalue()


@pytest.mark.parametrize("row_count, page_count", [(3, 1), (57, 3)])
@pytest.mark.parametrize("size", [None, (360, 90), (50, 100)])
def test_layout_footer_and_logo(monkeypatch, row_count, page_count, size) -> None:
    placed = []

    class InspectPdf(report_view._ReportPdf):
        def __init__(self, logo):
            super().__init__(logo)
            self.set_compression(False)

        def image(self, name, x, y, w, h):
            placed.append((self.page_no(), x, y, w, h))
            return super().image(name, x=x, y=y, w=w, h=h)

    monkeypatch.setattr(report_view, "_ReportPdf", InspectPdf)
    logo = _png(*size, "teal") if size else None
    report = _report(row_count)
    before = report.to_dict()
    pdf = report_view._render_pdf(report, logo)
    assert report.to_dict() == before
    assert len(re.findall(rb"/Type /Page\b", pdf)) == page_count
    assert pdf.count(_FOOTER) == page_count
    assert b"Scheduler+ Report" in pdf and b"Example hall" in pdf
    if size is None:
        assert not placed and b"/Subtype /Image" not in pdf
    else:
        assert b"/Subtype /Image" in pdf
        assert len(placed) == page_count
        for page, x, y, width, height in placed:
            assert width / height == pytest.approx(size[0] / size[1])
            assert x + width == pytest.approx(297 - 16, abs=0.02)
            assert y > 0
            assert y + height <= (32 if page == 1 else 16)


@pytest.fixture
async def pdf_client(hass, hass_client, monkeypatch):
    """A genuine local HA options/upload/report route, with synthetic history."""
    assert SchedulerPlusReportPdfView.requires_auth is True
    assert await async_setup_component(hass, "http", {})
    hass.http.register_view(OptionManagerFlowIndexView(hass.config_entries.options))
    hass.http.register_view(OptionManagerFlowResourceView(hass.config_entries.options))
    entry = MockConfigEntry(domain=DOMAIN, title="Scheduler+", options={"enable_brightness": False})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    report = _report(4)
    build = AsyncMock(return_value=report)
    monkeypatch.setattr(report_view, "async_build_report", build)
    return await hass_client(), entry, build, report


async def _branding_menu(client, entry):
    response = await client.post(_SETTINGS, json={"handler": entry.entry_id})
    assert response.status == 200
    menu = await response.json()
    assert menu["type"] == "menu"
    assert set(menu["menu_options"]) == {"scheduling_preferences", "report_branding"}
    path = f"{_SETTINGS}/{menu['flow_id']}"
    response = await client.post(path, json={"next_step_id": "report_branding"})
    assert response.status == 200
    form = await response.json()
    assert form["step_id"] == "report_branding" and not form["errors"]
    selectors = {field["name"]: field["selector"] for field in form["data_schema"]}
    assert selectors["report_logo_file"] == {"file": {"accept": "image/png,image/jpeg"}}
    assert selectors["remove_report_logo"] == {"boolean": {}}
    return path


async def _upload(client, content: bytes, *, filename: str = "logo.png") -> str:
    form = FormData()
    form.add_field("file", content, filename=filename, content_type="application/octet-stream")
    response = await client.post("/api/file_upload", data=form)
    assert response.status == 200
    return (await response.json())["file_id"]


async def _send_logo(client, entry, file_id=None, *, remove=False):
    path = await _branding_menu(client, entry)
    fields = {"remove_report_logo": remove}
    if file_id is not None:
        fields["report_logo_file"] = file_id
    response = await client.post(path, json=fields)
    assert response.status == 200
    return await response.json()


async def _get_pdf(client, path=_URL):
    response = await client.get(path)
    assert response.status == 200
    assert response.content_type == "application/pdf"
    assert response.headers["Content-Disposition"].startswith("attachment;")
    data = await response.read()
    assert data.startswith(b"%PDF-")
    return data


async def test_native_branding_set_replace_clear_and_report_routes(pdf_client, hass):
    client, entry, build, report = pdf_client
    runtime = entry.runtime_data
    before = report.to_dict()
    schedules = runtime.coordinator.data["schedules"].copy()
    prefs = dict(entry.options)
    assert b"/Subtype /Image" not in await _get_pdf(client)

    first_id = await _upload(client, _png(720, 180, "orange"))
    applied = await _send_logo(client, entry, first_id)
    assert applied["type"] == "create_entry" and "data" not in applied
    first = await _get_pdf(client)
    # A different Report card selects a different range/entity but gets the same site logo.
    another = await _get_pdf(client, _URL.replace("light.example", "switch.second_card"))
    assert b"/Width 384" in first and b"/Width 384" in another
    assert b"/Height 96" in first and b"/Height 96" in another
    assert build.await_args.args == (hass, ["switch.second_card"], _DAY, _DAY)

    jpg = BytesIO()
    Image.new("RGB", (220, 340), "purple").save(jpg, "JPEG")
    second_id = await _upload(client, jpg.getvalue(), filename="other.jpg")
    assert (await _send_logo(client, entry, second_id))["type"] == "create_entry"
    second = await _get_pdf(client)
    assert b"/Width 83" in second and b"/Height 128" in second
    assert b"/Width 384" not in second
    persisted = await ReportLogoStore(hass, entry.entry_id).async_get()
    assert persisted == await async_get_site_logo(hass)
    assert decode_report_logo(persisted).size == (83, 128)

    # Submitting unchanged settings is a no-op. Clearing does not reset preferences.
    assert (await _send_logo(client, entry))["type"] == "create_entry"
    assert await async_get_site_logo(hass) == persisted
    assert (await _send_logo(client, entry, remove=True))["type"] == "create_entry"
    assert await ReportLogoStore(hass, entry.entry_id).async_get() is None
    assert b"/Subtype /Image" not in await _get_pdf(client)
    assert report.to_dict() == before and runtime.coordinator.data["schedules"] == schedules
    assert dict(entry.options) == prefs and entry.runtime_data is runtime


@pytest.mark.parametrize("bad_file", [
    b"Not an image", _png(70, 20, "teal")[:30], _png(2049, 32, "teal"), b"x" * (1024 * 1024 + 1),
], ids=["not-image", "truncated", "oversized-dimension", "oversized-file"])
async def test_invalid_native_upload_keeps_current_logo(pdf_client, hass, bad_file):
    client, entry, _, _ = pdf_client
    original = await _upload(client, _png(80, 40, "orange"))
    assert (await _send_logo(client, entry, original))["type"] == "create_entry"
    previous = await async_get_site_logo(hass)
    file_id = await _upload(client, bad_file)
    result = await _send_logo(client, entry, file_id)
    assert result["type"] == "form" and result["step_id"] == "report_branding"
    assert result["errors"] == {"report_logo_file": "invalid_report_logo"}
    assert await async_get_site_logo(hass) == previous
    # A rejected upload doesn't overwrite the known-good logo.
    assert b"/Width 80" in await _get_pdf(client)


async def test_scheduling_preferences_still_available_and_save(pdf_client):
    client, entry, _, _ = pdf_client
    root = await client.post(_SETTINGS, json={"handler": entry.entry_id})
    menu = await root.json()
    path = f"{_SETTINGS}/{menu['flow_id']}"
    response = await client.post(path, json={"next_step_id": "scheduling_preferences"})
    form = await response.json()
    assert form["step_id"] == "scheduling_preferences"
    fields = {field["name"]: field for field in form["data_schema"]}
    assert fields["enable_brightness"]["default"] is False
    assert "report_logo_file" not in fields
    response = await client.post(path, json={
        "weekday_days": ["mon"], "weekend_days": ["sun"],
        "working_hours_start": "09:00:00", "working_hours_end": "17:00:00",
        "enable_brightness": True, "enable_fade_in": True,
    })
    assert (await response.json())["type"] == "create_entry"
    assert entry.options["enable_brightness"] is True
    assert entry.options["working_hours_start"] == "09:00:00"


async def test_two_separate_home_assistant_instances(pdf_client, tmp_path, aiohttp_client):
    client_a, entry_a, _, _ = pdf_client
    file_a = await _upload(client_a, _png(96, 44, "orange"))
    assert (await _send_logo(client_a, entry_a, file_a))["type"] == "create_entry"

    root_b = tmp_path / "other-site"
    root_b.mkdir()
    async with async_test_home_assistant(config_dir=str(root_b)) as site_b:
        try:
            assert await async_setup_component(site_b, "http", {})
            site_b.http.register_view(SchedulerPlusReportPdfView)
            entry_b = MockConfigEntry(domain=DOMAIN, title="Scheduler+")
            entry_b.add_to_hass(site_b)
            user_b = await site_b.auth.async_create_user("Second site", group_ids=["system-admin"])
            refresh_b = await site_b.auth.async_create_refresh_token(user_b, client_id="http://localhost/")
            access_b = site_b.auth.async_create_access_token(refresh_b)
            client_b = await aiohttp_client(site_b.http.app, headers={"Authorization": f"Bearer {access_b}"})
            assert b"/Subtype /Image" not in await _get_pdf(client_b)
            await report_logo_store(site_b, entry_b.entry_id).async_replace(_png(63, 125, "teal"))
            assert b"/Width 63" in await _get_pdf(client_b)
            assert b"/Width 96" in await _get_pdf(client_a)
            await client_b.close()
        finally:
            await site_b.async_stop(force=True)


def test_optional_pdf_recap_and_wrapped_continuation(monkeypatch):
    """The summary counts shown changes (not raw readings) and labels incomplete history."""
    report = _report(57)
    long_name = "Temperature and monitoring on the upper-floor west reception area and the very long south reception corridor entrance beside the meeting-room gallery"
    report.entities[0].friendly_name = long_name
    report.entities[0].truncated = True
    report.entities[0].points[0] = ReportPoint(
        at=report.entities[0].points[0].at, state="off", attributes={},
        source="rule", rule_name="Example timer",
    )
    report.entities.append(EntityReport(
        entity_id="light.no_history", domain="light", friendly_name="No-history example", no_data=True,
    ))
    # Two identical significant climate points are one displayed row; an
    # annotation on a hidden duplicate must not increment the PDF recap.
    start = report.entities[0].points[0].at
    report.entities.append(EntityReport(
        entity_id="climate.sample", domain="climate", friendly_name="Example climate",
        points=[
            ReportPoint(at=start, state="heat", attributes={"temperature": 20, "current_temperature": 18}, source="other"),
            ReportPoint(at=start + timedelta(minutes=1), state="heat", attributes={"temperature": 20, "current_temperature": 19}, source="rule", rule_name="Hidden duplicate"),
        ],
    ))
    headings = []

    class InspectPdf(report_view._ReportPdf):
        def __init__(self, logo):
            super().__init__(logo)
            self.set_compression(False)

        def multi_cell(self, w, h, text="", *args, **kwargs):
            if text.startswith("Temperature and monitoring"):
                headings.append((self.page_no(), self.get_x(), w, text))
            return super().multi_cell(w, h, text, *args, **kwargs)

    monkeypatch.setattr(report_view, "_ReportPdf", InspectPdf)
    before = report.to_dict()
    pdf = report_view._render_pdf(report, _png(360, 90, "teal"))
    assert b"Devices: 3" in pdf and b"History rows shown: 58" in pdf
    assert b"Schedule matches: 1" in pdf
    assert b"No history found: 1" in pdf and b"Truncated histories: 1" in pdf
    assert headings[0] == (1, 16, 0, long_name)
    assert len(headings) >= 3
    assert all(x == 16 and width == 0 and text == long_name + " (continued)" for _, x, width, text in headings[1:])
    assert report.to_dict() == before
    assert b"Hidden duplicate" not in pdf
    assert pdf.count(_FOOTER) == len(re.findall(rb"/Type /Page\b", pdf))
