"""
Design diagram builder.

This file builds the SVG design diagrams used in the docs, following the
diagram-design skill (LangChain Docs profile). Fonts are embedded as base64
@font-face rules from fontfaces.css so the SVG renders the same on GitHub.

Usage:
    from svglib import Diagram, check, png
    d = Diagram("slug", "Title", "One sentence description", 860, 400)
    d.zone(x, y, w, h, "LABEL")
    d.arrow("M x,y H x2", kind="default" | "accent" | "link", dashed=False)
    d.label(cx, baseline, "TEXT")
    d.node(x, y, w, h, "Name", "sub", kind="backend" | "focal" | "store" | "external" | "input" | "optional", tag="1")
    d.text(x, y, "caption", size=11)
    d.legend([("backend", "Step"), ("arrow", "Flow")], y)
    d.save("docs/images/x.svg", html_copy="/scratch/x.html")

Draw zones first, then arrows and labels, then nodes. Keep coordinates on a 4px grid.
"""

# Imports
import subprocess
import os


# Folder of this file, where fontfaces.css lives
HERE = os.path.dirname(os.path.abspath(__file__))

# Base64 Inter and IBM Plex Mono font faces
FONTS = open(os.path.join(HERE, "fontfaces.css")).read()

# Color tokens of the LangChain Docs profile
C = dict(
    paper="#ffffff", paper2="#f3f3f4", ink="#161f34", muted="#4f5d73", soft="#40668d",
    accent="#0066cc", accent_tint="rgba(0,102,204,0.08)", link="#735a6c",
)

# Font stacks
SANS = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace"

# Node treatments: fill, stroke, dash pattern
KINDS = {
    "focal": ("rgba(0,102,204,0.08)", C["accent"], None),
    "backend": ("#ffffff", C["ink"], None),
    "store": ("rgba(22,31,52,0.05)", C["muted"], None),
    "external": ("rgba(22,31,52,0.03)", "rgba(22,31,52,0.30)", None),
    "input": ("rgba(79,93,115,0.10)", C["soft"], None),
    "optional": ("rgba(22,31,52,0.02)", "rgba(22,31,52,0.20)", "4,3"),
}


def esc(text) -> str:
    """Escape text for SVG."""

    # Replace XML special characters
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class Diagram:
    """One SVG diagram built from zones, arrows, labels, nodes and text."""

    def __init__(self, slug, title, desc, w, h):
        """Start an empty diagram of size w x h."""

        # Accessible name and size
        self.slug, self.title, self.desc, self.w, self.h = slug, title, desc, w, h

        # SVG fragments in drawing order
        self.parts = []

    def zone(self, x, y, w, h, label):
        """Draw a grouping rectangle with an eyebrow label."""

        # Label mask width from the character count
        lw = int((len(label) * 7 * 0.62 + len(label) + 16 + 3) // 4 * 4)

        # Zone box, label mask and label
        self.parts.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="rgba(22,31,52,0.02)" stroke="rgba(22,31,52,0.10)" stroke-width="0.8"/>'
            f'<rect x="{x + 16}" y="{y + 4}" width="{lw}" height="12" rx="2" fill="{C["paper"]}"/>'
            f'<text x="{x + 16 + lw / 2}" y="{y + 13}" fill="{C["soft"]}" font-size="7" font-weight="500" font-family="{MONO}" text-anchor="middle" letter-spacing="0.14em">{esc(label)}</text>'
        )

    def arrow(self, d, kind="default", dashed=False):
        """Draw a connector path with an arrowhead."""

        # Stroke color and marker per kind
        stroke = {"default": C["muted"], "accent": C["accent"], "link": C["link"]}[kind]
        marker = {"default": "arrow", "accent": "arrow-accent", "link": "arrow-link"}[kind]
        width = "1.4" if kind == "accent" else ("1" if dashed else "1.2")
        dash = ' stroke-dasharray="4,3"' if dashed else ""

        # The path
        self.parts.append(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{width}"{dash} marker-end="url(#{marker})"/>')

    def line(self, d, color="muted", dashed=False, width=1):
        """Draw a plain line without an arrowhead."""

        # Optional dash pattern
        dash = ' stroke-dasharray="4,3"' if dashed else ""
        self.parts.append(f'<path d="{d}" fill="none" stroke="{C[color]}" stroke-width="{width}"{dash}/>')

    def label(self, cx, baseline, text, color="soft"):
        """Draw an arrow label on a paper mask."""

        # Mask width from the character count
        w = int((len(text) * 8 * 0.62 + len(text) * 0.5 + 10 + 3) // 4 * 4)

        # Mask and text
        self.parts.append(
            f'<rect x="{cx - w / 2}" y="{baseline - 9}" width="{w}" height="12" rx="2" fill="{C["paper"]}"/>'
            f'<text x="{cx}" y="{baseline}" fill="{C[color]}" font-size="8" font-weight="500" font-family="{MONO}" text-anchor="middle" letter-spacing="0.06em">{esc(text)}</text>'
        )

    def node(self, x, y, w, h, name, sub=None, kind="backend", tag=None, name2=None):
        """Draw a node box with a name, optional second name line, sublabel and tag."""

        # Treatment for this kind of node
        fill, stroke, dash = KINDS[kind]
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ""

        # Paper mask, then the styled box
        p = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{C["paper"]}"/>',
             f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash_attr}/>']

        # Small rectangular tag in the top left corner
        if tag:
            tw = int((len(tag) * 7 * 0.62 + len(tag) * 0.6 + 8 + 3) // 4 * 4)
            p.append(f'<rect x="{x + 8}" y="{y + 6}" width="{tw}" height="12" rx="2" fill="none" stroke="{stroke}" stroke-opacity="0.4" stroke-width="0.8"/>'
                     f'<text x="{x + 8 + tw / 2}" y="{y + 15}" fill="{stroke}" font-size="7" font-weight="500" font-family="{MONO}" text-anchor="middle" letter-spacing="0.08em">{esc(tag)}</text>')

        # Vertically center the name lines and the sublabel
        cx = x + w / 2
        lines = [name] + ([name2] if name2 else [])
        total = len(lines) * 14 + (14 if sub else 0)
        top = y + h / 2 - total / 2 + 11 + (4 if tag else 0)
        for i, text in enumerate(lines):
            p.append(f'<text x="{cx}" y="{top + i * 14}" fill="{C["ink"]}" font-size="12" font-weight="600" font-family="{SANS}" text-anchor="middle">{esc(text)}</text>')
        if sub:
            p.append(f'<text x="{cx}" y="{top + len(lines) * 14 + 2}" fill="{C["muted"]}" font-size="9" font-family="{MONO}" text-anchor="middle">{esc(sub)}</text>')

        self.parts.append("".join(p))

    def text(self, x, y, s, size=11, color="muted", anchor="start", weight=400, mono=False):
        """Draw free text such as a caption."""

        # Sans for prose, mono for technical text
        family = MONO if mono else SANS
        self.parts.append(f'<text x="{x}" y="{y}" fill="{C[color]}" font-size="{size}" font-weight="{weight}" font-family="{family}" text-anchor="{anchor}">{esc(s)}</text>')

    def raw(self, s):
        """Add a raw SVG fragment."""

        # Used for custom shapes
        self.parts.append(s)

    def legend(self, items, y):
        """Draw the legend strip at the bottom."""

        # Separator line and LEGEND label
        self.parts.append(f'<line x1="32" y1="{y - 8}" x2="{self.w - 32}" y2="{y - 8}" stroke="rgba(22,31,52,0.10)" stroke-width="0.8"/>')
        self.parts.append(f'<text x="32" y="{y + 12}" fill="{C["muted"]}" font-size="8" font-weight="500" font-family="{MONO}" letter-spacing="0.14em">LEGEND</text>')

        # One swatch and text per item
        x = 112
        for kind, text in items:
            if kind in KINDS:
                fill, stroke, dash = KINDS[kind]
                dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
                self.parts.append(f'<rect x="{x}" y="{y + 2}" width="20" height="12" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash_attr}/>')
            else:
                stroke = {"arrow": C["muted"], "arrow-accent": C["accent"], "arrow-dashed": C["muted"], "arrow-link": C["link"]}[kind]
                dash_attr = ' stroke-dasharray="4,3"' if kind == "arrow-dashed" else ""
                self.parts.append(f'<line x1="{x}" y1="{y + 8}" x2="{x + 20}" y2="{y + 8}" stroke="{stroke}" stroke-width="1.2"{dash_attr}/>')
            self.parts.append(f'<text x="{x + 28}" y="{y + 12}" fill="{C["muted"]}" font-size="9" font-family="{MONO}">{esc(text)}</text>')
            x += 28 + len(text) * 9 * 0.62 + 28

    def svg(self, fonts=True):
        """Return the full SVG document."""

        # Optional embedded fonts
        style = f"<style>{FONTS}</style>" if fonts else ""

        # Header, markers, background and parts
        return (
            f'<svg width="{self.w}" viewBox="0 0 {self.w} {self.h}" xmlns="http://www.w3.org/2000/svg" role="img" '
            f'aria-labelledby="{self.slug}-title {self.slug}-desc">\n'
            f'<title id="{self.slug}-title">{esc(self.title)}</title>\n'
            f'<desc id="{self.slug}-desc">{esc(self.desc)}</desc>\n'
            f"<defs>{style}"
            f'<marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{C["muted"]}"/></marker>'
            f'<marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{C["accent"]}"/></marker>'
            f'<marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="{C["link"]}"/></marker>'
            f"</defs>\n"
            f'<rect width="100%" height="100%" fill="{C["paper"]}"/>\n' + "\n".join(self.parts) + "\n</svg>\n"
        )

    def save(self, path, html_copy=None):
        """Write the SVG, and optionally an HTML copy for the skill checks."""

        # The SVG used in the docs
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n' + self.svg())

        # HTML wrapper read by verify_geometry.py and self_check.py
        if html_copy:
            with open(html_copy, "w") as f:
                f.write(
                    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
                    f"<title>{esc(self.title)}</title><style>body{{background:#fff;margin:0;padding:24px}}"
                    f".diagram-container{{width:100%;overflow-x:auto}}svg{{width:100%;min-width:{self.w}px;display:block}}</style></head>"
                    f'<body><h1>{esc(self.title)}</h1><div class="diagram-container">{self.svg(fonts=False)}</div></body></html>'
                )


def check(html_path):
    """Run the diagram-design geometry and self checks on an HTML copy."""

    # Both checks ship with the diagram-design skill
    skill_scripts = os.path.expanduser("~/.claude/skills/diagram-design/scripts")
    for script in ("verify_geometry.py", "self_check.py"):
        result = subprocess.run(["python3", os.path.join(skill_scripts, script), html_path], capture_output=True, text=True)
        print(script, result.returncode, (result.stdout + result.stderr).strip()[:1500])


def png(svg_path, out_png, width=1720):
    """Render an SVG to PNG for visual review."""

    # rsvg-convert is installed with Homebrew librsvg
    subprocess.run(["rsvg-convert", "-w", str(width), svg_path, "-o", out_png], check=True)
