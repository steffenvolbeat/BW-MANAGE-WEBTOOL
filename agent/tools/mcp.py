from __future__ import annotations

from agent_framework import MCPStdioTool, ToolProtocol
from typing import Any


def create_mcp_tools() -> list[ToolProtocol | Any]:
    """Provide MCP stdio tools (e.g., Playwright MCP for portal automation)."""
    return [
        MCPStdioTool(
            name="Playwright MCP",
            description="Browser automation via Playwright MCP (installable via npx @playwright/mcp)",
            command="npx",
            args=["-y", "@playwright/mcp@latest"],
            load_prompts=False,
        ),
    ]
