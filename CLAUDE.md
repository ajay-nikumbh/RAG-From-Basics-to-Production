# Project Rules

These rules apply to all work in this repository.

## 1. Git

- All commits are authored and committed as `ajay-nikumbh <37560890+ajay-nikumbh@users.noreply.github.com>`.
- No co-author lines and no AI attribution in commits.
- Work in small steps. Commit and push the smallest complete feature, then start the next one.
- Break big features into smaller ones (for example ingestion: PDF parsing, Excel parsing, chunking, each pushed separately).
- Work sequentially. Do not run parallel agents.

## 2. Documentation

- Every major feature or decision gets a detailed doc in the `docs` folder of that implementation.
- Doc names use numbering: `01. <Document Name>.md`, `02. <Document Name>.md`, in the order the features are built.
- Each doc explains why the choice was made and how it works.
- When an architecture is implemented, its doc gives a complete breakdown of how it works.
- Each doc includes mermaid diagrams and design diagrams (diagram-design skill, SVG in `docs/images`).

## 3. Markdown style

- All tables are HTML `<table width="100%">` (no markdown pipe tables). Add relevant columns when needed. No horizontal scroll.
- Run the table spacer post-processor so GitHub renders tables at full width.
- Mermaid labels: max about 20 characters per line, break longer text with `<br/>`.
- No emojis, unicode arrows, em dashes or other decorative symbols. Plain ASCII outside math.
- Folder and file names use the `NN. Name` format where they are part of a sequence.

## 4. Implementation stack

- APIs are built with FastAPI.
- LLM: Azure OpenAI. Embeddings: OpenAI embeddings. Vector database: FAISS.
- Secrets live in the repository root `.env` (never committed). Commit only `.env.example` with variable names.
- Create a clean folder structure first, then write code.

## 5. Code style

- Clean, simple, readable code. No clever or complex constructs when a simple one works.
- Every file starts with a module docstring that explains what the file does overall.
- Imports come right after the docstring, under one `# Imports` comment, with no other comments in the import block.
- Order imports from biggest to smallest: longest import line first, shortest last.
- Put a short comment above each logical block, then the code, then a blank line before the next block.

Example:

```python
# Main method
def three_sum(self, nums: list[int]) -> list[list[int]]:

    # Sort so two pointers and duplicate skipping work
    nums.sort()

    # Number of elements
    n = len(nums)

    # The answer list
    res = []
```
