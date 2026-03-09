from __future__ import annotations

import json
from datetime import datetime
from typing import Annotated, Literal

from agent_framework import tool

from .approvals import ApprovalManager
from .audit import AuditLogger
from .portal import PortalAutomationClient

Portal = Literal["linkedin", "indeed", "stepstone"]
Provider = Literal["outlook", "gmail"]


def _parse_iso(timestamp: str) -> str:
    try:
        return datetime.fromisoformat(timestamp).isoformat()
    except ValueError:
        return timestamp


class AutomationTools:
    """Collection of tools bound to the approval + audit backbone."""

    def __init__(
        self,
        audit_logger: AuditLogger,
        approval_manager: ApprovalManager,
        default_email_provider: str,
        default_calendar_provider: str,
        default_timezone: str,
    ) -> None:
        self.audit = audit_logger
        self.approvals = approval_manager
        self.portal_client = PortalAutomationClient(audit_logger)
        self.default_email_provider = default_email_provider
        self.default_calendar_provider = default_calendar_provider
        self.default_timezone = default_timezone

    @tool
    def apply_to_job_portal(
        self,
        portal: Annotated[Portal, "Job portal to target (linkedin|indeed|stepstone)"],
        job_url: Annotated[str, "Public job posting URL"],
        applicant_name: Annotated[str, "Applicant full name"],
        cv_url: Annotated[str | None, "URL to CV or resume"],
        cover_letter: Annotated[str | None, "Short cover letter text"],
        approval_id: Annotated[str | None, "Existing approval id to execute the submission"] = None,
    ) -> str:
        payload = {
            "job_url": job_url,
            "applicant_name": applicant_name,
            "cv_url": cv_url,
            "cover_letter": cover_letter,
        }
        record, approved = self.approvals.ensure("job_application", portal, payload, approval_id)
        if not approved:
            return (
                "Approval required for application. Review payload and call approve_action with approval_id="
                f"{record.id} before re-running."
            )

        result = self.portal_client.submit_application(portal, payload)
        self.audit.log(
            "action",
            f"apply:{portal}",
            "executed",
            {"approval_id": record.id, **payload, "result": result},
        )
        return result

    @tool
    def schedule_follow_up_email(
        self,
        provider: Annotated[Provider, "Email provider (outlook|gmail)"],
        to: Annotated[str, "Recipient email"],
        subject: Annotated[str, "Email subject"],
        body: Annotated[str, "Email body"],
        send_at_iso: Annotated[str, "ISO-8601 timestamp when email should be sent"],
        approval_id: Annotated[str | None, "Existing approval id to execute the schedule"] = None,
    ) -> str:
        payload = {
            "provider": provider or self.default_email_provider,
            "to": to,
            "subject": subject,
            "body": body,
            "send_at": _parse_iso(send_at_iso),
        }
        record, approved = self.approvals.ensure("follow_up_email", payload["provider"], payload, approval_id)
        if not approved:
            return (
                "Approval required for follow-up email. Call approve_action with approval_id="
                f"{record.id} before executing."
            )

        self.audit.log(
            "action",
            "follow_up_email",
            "scheduled",
            {"approval_id": record.id, **payload},
        )
        return (
            f"Scheduled follow-up email via {payload['provider']} to {to} at {payload['send_at']}."
            " (Delivery stubbed; wire up provider API next.)"
        )

    @tool
    def create_calendar_event(
        self,
        provider: Annotated[Provider, "Calendar provider (outlook|gmail)"] | None,
        title: Annotated[str, "Event title"],
        start_time_iso: Annotated[str, "Event start time ISO-8601"],
        end_time_iso: Annotated[str, "Event end time ISO-8601"],
        attendees: Annotated[list[str], "Attendee email addresses"],
        description: Annotated[str | None, "Event description"],
        approval_id: Annotated[str | None, "Existing approval id to execute the event creation"] = None,
    ) -> str:
        provider_name = provider or self.default_calendar_provider
        payload = {
            "provider": provider_name,
            "title": title,
            "start": _parse_iso(start_time_iso),
            "end": _parse_iso(end_time_iso),
            "attendees": attendees,
            "description": description,
            "timezone": self.default_timezone,
        }
        record, approved = self.approvals.ensure("calendar_event", provider_name, payload, approval_id)
        if not approved:
            return (
                "Approval required for calendar event. Call approve_action with approval_id="
                f"{record.id} before executing."
            )

        self.audit.log(
            "action",
            "calendar_event",
            "scheduled",
            {"approval_id": record.id, **payload},
        )
        return (
            f"Created calendar event '{title}' via {provider_name} from {payload['start']} to {payload['end']}"
            " (Scheduling stubbed; connect provider API next.)"
        )

    @tool
    def approve_action(
        self,
        approval_id: Annotated[str, "Approval id returned by other tools"],
        approve: Annotated[bool, "True to approve, False to reject"] = True,
    ) -> str:
        record = self.approvals.approve(approval_id, approve)
        return f"Approval {record.status} for {record.action_type}:{record.target}."

    @tool
    def list_pending_actions(self) -> str:
        pending = self.approvals.list_pending()
        return json.dumps([pending_item.__dict__ for pending_item in pending], ensure_ascii=True, indent=2)

    def export_tools(self) -> list[object]:
        return [
            self.apply_to_job_portal,
            self.schedule_follow_up_email,
            self.create_calendar_event,
            self.approve_action,
            self.list_pending_actions,
        ]
