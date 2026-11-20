"""
Prompt builder.

This file turns the user question and the retrieved chunks into the chat
messages sent to the Azure OpenAI model. The system message sets the rules
(answer only from the context, say when the answer is missing, cite sources as
[1], [2]). The user message holds the numbered context chunks, each with its
source label, followed by the question.
"""

# Imports
from app.vectorstore.faiss_store import SearchResult


# Rules the model must follow for every answer
SYSTEM_PROMPT = """You are a helpful assistant that answers questions using only the provided context.

Rules:
1. Use ONLY the information in the CONTEXT. Do not use outside knowledge.
2. If the CONTEXT does not contain the answer, reply exactly: "I could not find this in the provided documents."
3. After each fact, cite the number of the context block it came from in square brackets, like [1] or [2].
4. Be clear and concise."""

# Reply the model must use when the answer is not in the context
NOT_FOUND_ANSWER = "I could not find this in the provided documents."


def source_label(metadata: dict) -> str:
    """Build a short source label such as 'report.pdf, page 3' or 'leave.xlsx, sheet Leave'."""

    # Always start with the file name
    label = metadata.get("source", "unknown")

    # Add the page for PDFs or the sheet for Excel files
    if "page" in metadata:
        label += f", page {metadata['page']}"
    elif "sheet" in metadata:
        label += f", sheet {metadata['sheet']}"

    return label


def format_context(results: list[SearchResult]) -> str:
    """Number each retrieved chunk and put its source label above its text."""

    # One block per chunk: [n] (source label) followed by the chunk text
    blocks = []
    for number, result in enumerate(results, start=1):
        blocks.append(f"[{number}] ({source_label(result.document.metadata)})\n{result.document.text}")

    # Blank line between blocks so the model sees where each one ends
    return "\n\n".join(blocks)


def build_messages(question: str, results: list[SearchResult]) -> list[dict]:
    """Return the system and user chat messages for the question and its context."""

    # User message: the context blocks, then the question
    user_message = f"CONTEXT:\n{format_context(results)}\n\nQUESTION: {question}"

    # Chat messages in the format the OpenAI API expects
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]
