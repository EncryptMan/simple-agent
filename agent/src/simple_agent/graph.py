"""Minimal LangChain agent graph for deployment."""

from __future__ import annotations

import ast
import os
from datetime import datetime, timezone
from typing import Any
import requests

from langchain.agents import create_agent
from langchain_core.tools import tool

DEFAULT_MODEL = os.getenv("SIMPLE_AGENT_MODEL", "openai:gpt-5.4-mini")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")


@tool
def utc_now() -> str:
    """Return the current UTC timestamp in ISO format."""
    return datetime.now(tz=timezone.utc).isoformat()


@tool
def calculator(expression: str) -> str:
    """Evaluate a simple arithmetic expression safely.

    Supported operators: +, -, *, /, %, ** and parentheses.
    """
    parsed = ast.parse(expression, mode="eval")
    allowed_nodes = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Constant,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.Mod,
        ast.Pow,
        ast.USub,
        ast.UAdd,
        ast.Load,
    )

    for node in ast.walk(parsed):
        if not isinstance(node, allowed_nodes):
            raise ValueError("Expression contains unsupported syntax")

    result: Any = eval(compile(parsed, "<calculator>", "eval"), {"__builtins__": {}}, {})
    return str(result)


@tool
def web_search(query: str) -> str:
    """Perform a web search using Tavily API and return the top result snippet."""
    if not TAVILY_API_KEY:
        raise ValueError("Tavily API key is not set")

    response = requests.post(
        "https://api.tavily.com/search",
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
        json={"query": query}
    )
    response.raise_for_status()
    data = response.json()

    result = ''

    for item in data.get("results", []):
        result += f"Title: {item.get('title', 'No title')}\n"
        result += f"URL: {item.get('url', 'No URL')}\n"
        result += f"Content: {item.get('content', 'No content')}\n\n"
        
    return result


graph = create_agent(
    model=DEFAULT_MODEL,
    tools=[utc_now, calculator, web_search],
    system_prompt=(
        "You are a concise assistant. "
        "Use tools when they add factual precision, then return a direct answer."
    ),
    name="simple_agent",
)
