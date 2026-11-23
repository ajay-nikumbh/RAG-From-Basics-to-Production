"""
Query rewriting prompt.

This file builds the chat messages for the one gpt-4o-mini call that both
condenses a follow-up question into a standalone question (using the recent
chat turns) and rewrites it as a search query in the wording the documents
are likely to use. The model must reply with JSON holding the two strings.
"""


# Rules for the rewrite call
SYSTEM_PROMPT = """You rewrite questions for a document search system. You never answer them.

Given the chat history and the latest question, return two things:
1. standalone_question: the latest question rewritten so it can be understood without the chat history. Replace words like "it", "they", "that", "this one" and follow-ups like "what about X?" with what they refer to. Keep the meaning and the language. If the question is already standalone, copy it unchanged.
2. search_query: the standalone question rewritten as a short search query (at most 30 words) with its key terms, the full form of abbreviations and the words a document about it would likely use.

Use the chat history only to work out what the latest question refers to. Do not copy answers, names or terms from earlier answers into either field unless the latest question asks about them.
Never add facts, names or numbers that the question and history do not contain.
Reply with JSON only, in this form: {"standalone_question": "...", "search_query": "..."}"""

# Longest part of an earlier answer shown to the rewriter, in characters
HISTORY_ANSWER_CHARS = 300


def format_history(history: list[dict]) -> str:
    """Write earlier turns as 'Q: ... / A: ...' lines, with long answers shortened."""

    # One question and answer pair per turn
    lines = []
    for turn in history:
        answer = turn.get("answer", "")
        if len(answer) > HISTORY_ANSWER_CHARS:
            answer = answer[:HISTORY_ANSWER_CHARS] + "..."
        lines.append(f"Q: {turn.get('question', '')}\nA: {answer}")

    # Blank line between turns
    return "\n\n".join(lines)


def build_rewrite_messages(question: str, history: list[dict]) -> list[dict]:
    """Return the system and user messages for the rewrite call."""

    # History block, or a note that this is the first question
    history_text = format_history(history) if history else "(no earlier turns)"

    # User message: history first, then the latest question
    user_message = f"CHAT HISTORY:\n{history_text}\n\nLATEST QUESTION: {question}"

    # Chat messages in the format the OpenAI API expects
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]
