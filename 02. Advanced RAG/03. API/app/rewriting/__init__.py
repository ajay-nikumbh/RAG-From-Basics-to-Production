"""
Query rewriting package (online query, before retrieval).

Turns the user question, and the recent chat turns, into one standalone
search query with gpt-4o-mini. The original question is still used to
write the answer; the rewrite is only used to search.
"""
