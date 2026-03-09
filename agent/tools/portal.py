from __future__ import annotations

import os
from typing import Any

import httpx

from .audit import AuditLogger


class PortalAutomationClient:
    """HTTP handoff to an external portal automation service (e.g., MCP/Playwright worker)."""

    def __init__(self, audit_logger: AuditLogger) -> None:
        self.audit = audit_logger
        self.endpoint = os.getenv("PORTAL_AUTOMATION_URL")
        self.api_key = os.getenv("PORTAL_AUTOMATION_API_KEY")

    def submit_application(self, portal: str, payload: dict[str, Any]) -> str:
        if not self.endpoint:
            self.audit.warn(
                "portal_automation_missing_endpoint",
                {"portal": portal, "payload_keys": list(payload.keys())},
            )
            return (
                "Portal automation endpoint not configured. Set PORTAL_AUTOMATION_URL/PORTAL_AUTOMATION_API_KEY in .env. "
                "Payload ready to send: " + str(payload)
            )

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        with httpx.Client(timeout=20) as client:
            try:
                response = client.post(self.endpoint, json={"portal": portal, **payload}, headers=headers)
                response.raise_for_status()
                data = response.json()
                self.audit.info(
                    "portal_automation_submit",
                    {"portal": portal, "status_code": response.status_code, "response": data},
                )
                return f"Portal automation dispatched to {portal}. Response: {data}"
            except httpx.HTTPStatusError as exc:
                self.audit.error(
                    "portal_automation_http_error",
                    {"portal": portal, "status_code": exc.response.status_code, "body": exc.response.text},
                )
                return f"Portal automation failed with status {exc.response.status_code}: {exc.response.text}"
            except httpx.HTTPError as exc:
                self.audit.error(
                    "portal_automation_transport_error",
                    {"portal": portal, "error": str(exc)},
                )
                return f"Portal automation transport error: {exc}"
