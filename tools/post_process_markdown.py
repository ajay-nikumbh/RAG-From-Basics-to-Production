"""
Markdown post-processor.

This file prepares every Markdown file in the repository for GitHub:

1. Mermaid labels longer than 20 characters are broken onto new lines with
   <br/>, so GitHub does not clip them.
2. Every HTML table gets a transparent spacer image in each header cell. The
   spacer widths follow the text length of each column, which makes GitHub
   render the table at full width without horizontal scroll.

Running it again is safe: existing spacers are replaced, wrapped labels stay.

Usage:
    python3 tools/post_process_markdown.py <repo root> [path parts to skip ...]
"""

# Imports
from urllib.parse import quote
import textwrap
import html
import sys
import os
import re


# Longest Mermaid label line in characters
MAX_LABEL = 20

# Sum of spacer widths per table, wider than any GitHub content column
TOTAL_WIDTH = 1400

# Opening and closing brackets of Mermaid node shapes
SHAPES = [("[(", ")]"), ("((", "))"), ("[[", "]]"), ("{{", "}}"), ("[", "]"), ("(", ")"), ("{", "}")]


def wrap_label(text: str) -> str:
    """Break a Mermaid label into lines of at most MAX_LABEL characters."""

    # Short labels without breaks stay as they are
    if len(text) <= MAX_LABEL and "<br/>" not in text:
        return text

    # Keep surrounding quotes outside the wrapping
    quote_mark = ""
    if len(text) >= 2 and text[0] == text[-1] == '"':
        quote_mark, text = '"', text[1:-1]

    # Wrap each existing line separately
    lines = []
    for part in re.split(r"<br\s*/?>", text):
        part = part.strip()
        lines += textwrap.wrap(part, MAX_LABEL, break_long_words=False, break_on_hyphens=False) or [part]

    return quote_mark + "<br/>".join(lines) + quote_mark


def wrap_flowchart_line(line: str) -> str:
    """Wrap edge labels and node labels on one flowchart line."""

    # Lines that hold styling or directives have no labels
    if line.strip().startswith(("%%", "classDef", "class ", "style ", "linkStyle", "click ", "direction")):
        return line

    # Edge labels: |text|, -- text -->, -. text .->
    line = re.sub(r"\|([^|]+)\|", lambda m: "|" + wrap_label(m.group(1)) + "|", line)
    line = re.sub(r"(--\s)([^>\-|][^>|]*?)(\s-->)", lambda m: m.group(1) + wrap_label(m.group(2).strip()) + m.group(3), line)
    line = re.sub(r"(-\.)([^.>][^>]*?)(\.->)", lambda m: m.group(1) + wrap_label(m.group(2).strip()) + m.group(3), line)

    # Node labels: ID[...], ID(...), ID{...} and the other shapes
    result, position = "", 0
    pattern = re.compile(r"([A-Za-z_][\w]*)(\[\(|\(\(|\[\[|\{\{|\[|\(|\{)")
    while True:
        match = pattern.search(line, position)
        if not match:
            result += line[position:]
            break
        closer = dict(SHAPES)[match.group(2)]
        start = match.end()
        end = line.find(closer, start)
        if end == -1:
            result += line[position:]
            break
        result += line[position:start] + wrap_label(line[start:end]) + closer
        position = end + len(closer)

    return result


def fix_mermaid(block: str) -> str:
    """Wrap labels in a flowchart block; leave other diagram types alone."""

    # Only flowcharts have node shapes to wrap
    lines = block.split("\n")
    if not lines[0].strip().startswith(("flowchart", "graph")):
        return block

    return "\n".join([lines[0]] + [wrap_flowchart_line(line) for line in lines[1:]])


def strip_tags(text: str) -> str:
    """Return the visible text of an HTML fragment."""

    # Remove tags, decode entities
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()


def fix_tables(text: str, spacer_src: str) -> str:
    """Add spacer images to the header cells of every full-width HTML table."""

    def fix_one(match):

        # Remove old spacers so widths are recalculated
        table = re.sub(r'<img src="[^"]*spacer\.png"[^>]*>', "", match.group(0))

        # Header cells
        head = re.search(r"<thead>\s*<tr>(.*?)</tr>\s*</thead>", table, re.S)
        if not head:
            return table
        headers = re.findall(r"<th>(.*?)</th>", head.group(1), re.S)

        # Longest visible text per column, from the header and every full row
        longest = [len(strip_tags(h)) for h in headers]
        for row in re.findall(r"<tr>(.*?)</tr>", table, re.S):
            cells = re.findall(r"<td>(.*?)</td>", row, re.S)
            if len(cells) == len(headers):
                for i, cell in enumerate(cells):
                    longest[i] = max(longest[i], len(strip_tags(cell)))

        # Spacer width per column, proportional to its text length
        weights = [min(max(n, 4), 70) for n in longest]
        widths = iter(max(40, int(TOTAL_WIDTH * w / sum(weights))) for w in weights)

        # Floated transparent image at the start of each header cell
        new_head = re.sub(r"<th>", lambda _: f'<th><img src="{spacer_src}" align="right" width="{next(widths)}" height="1">', head.group(0))
        return table.replace(head.group(0), new_head)

    return re.sub(r'<table width="100%">.*?</table>', fix_one, text, flags=re.S)


def main():
    """Process every Markdown file under the repository root."""

    # Arguments: repository root, then path parts to skip
    root = sys.argv[1]
    skip = sys.argv[2:] + [".git", "node_modules", ".venv"]

    # Walk the repository
    for folder, _, files in os.walk(root):
        if any(part in folder for part in skip):
            continue
        for name in files:
            if not name.endswith(".md"):
                continue

            # Read, fix Mermaid blocks, fix tables
            path = os.path.join(folder, name)
            original = open(path).read()
            fixed = re.sub(r"```mermaid\n(.*?)```", lambda m: "```mermaid\n" + fix_mermaid(m.group(1).rstrip("\n")) + "\n```", original, flags=re.S)
            spacer_src = quote(os.path.relpath(os.path.join(root, "assets", "spacer.png"), folder))
            fixed = fix_tables(fixed, spacer_src)

            # Write only when something changed
            if fixed != original:
                open(path, "w").write(fixed)
                print("updated", os.path.relpath(path, root))


if __name__ == "__main__":
    main()
