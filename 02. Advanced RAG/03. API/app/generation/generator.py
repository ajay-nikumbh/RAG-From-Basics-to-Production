"""
Answer generator.

This file sends the chat messages from the prompt builder to the Azure OpenAI
chat deployment and returns the answer text. Temperature and the maximum
answer length come from settings; a low temperature keeps factual answers
stable and close to the context. The prompt and answer token counts are added
to the usage meter of the running query.
"""

# Imports
from app.core.azure_client import get_azure_client
from app.services.usage import add_chat_tokens
from app.core.config import get_settings


def generate_answer(messages: list[dict], client=None) -> str:
    """Send the messages to the chat model and return the answer text."""

    # Read the shared settings and use the shared client unless a test passes one
    settings = get_settings()
    client = client or get_azure_client()

    # Stop early with a clear message if no chat deployment is configured
    if not settings.azure_openai_deployment_name:
        raise RuntimeError("AZURE_OPENAI_DEPLOYMENT_NAME must be set in .env")

    # One chat completion request
    response = client.chat.completions.create(
        model=settings.azure_openai_deployment_name,
        messages=messages,
        temperature=settings.llm_temperature,
        max_tokens=settings.llm_max_tokens,
    )

    # Count the prompt and answer tokens for usage and cost
    if getattr(response, "usage", None):
        add_chat_tokens(response.usage.prompt_tokens, response.usage.completion_tokens)

    # The answer is the text of the first (and only) choice
    return (response.choices[0].message.content or "").strip()
