from __future__ import annotations

import asyncio
import os
from pathlib import Path

from agent_framework import ChatAgent
from agent_framework.openai import OpenAIChatClient
from azure.ai.agentserver.agentframework import from_agent_framework
from dotenv import load_dotenv

from tools.actions import AutomationTools
from tools.approvals import ApprovalManager
from tools.audit import AuditLogger
from tools.mcp import create_mcp_tools

BASE_DIR = Path(__file__).parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH, override=True)


def _resolve_path(value: str, fallback: str) -> Path:
    raw = Path(value or fallback)
    return raw if raw.is_absolute() else (BASE_DIR / raw)


def _build_tooling() -> tuple[AutomationTools, AuditLogger]:
    audit_logger = AuditLogger(_resolve_path(os.getenv("AUDIT_LOG_PATH", "./data/audit.log"), "./data/audit.log"))
    approval_manager = ApprovalManager(
        _resolve_path(os.getenv("APPROVAL_DATA_PATH", "./data/approvals.json"), "./data/approvals.json"),
        audit_logger,
    )
    tools = AutomationTools(
        audit_logger=audit_logger,
        approval_manager=approval_manager,
        default_email_provider=os.getenv("DEFAULT_EMAIL_PROVIDER", "outlook"),
        default_calendar_provider=os.getenv("DEFAULT_CALENDAR_PROVIDER", "outlook"),
        default_timezone=os.getenv("DEFAULT_TIMEZONE", "UTC"),
    )
    return tools, audit_logger


def build_agent() -> ChatAgent:
    tools, _ = _build_tooling()
    chat_client = OpenAIChatClient(
        model_id=os.getenv("OPENAI_CHAT_MODEL_ID"),
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
        env_file_path=str(ENV_PATH),
    )
    instructions = (
        "You are an autonomy-focused career assistant. \n"
        "Always propose a short plan, request explicit approval per action, "
        "and include the approval_id you expect the user to confirm before running a tool. "
        "Actions: submit job applications (LinkedIn/Indeed/Stepstone), schedule follow-up emails, "
        "create calendar events. Never execute without approval. Keep responses concise."
    )
    return ChatAgent(
        chat_client=chat_client,
        instructions=instructions,
        tools=tools.export_tools() + create_mcp_tools(),
        default_options={"temperature": 0.2},
    )


async def main() -> None:
    agent = build_agent()
    # Agent-as-server host (OpenAI-compatible endpoint)
    await from_agent_framework(agent).run_async()


if __name__ == "__main__":
    asyncio.run(main())
