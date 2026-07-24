#!/usr/bin/env python3
"""Convert a Markdown file to a print-formatted HTML document.

Usage:
    python3 md-to-html.py input.md [output.html]

If no output filename is given, replaces the .md extension with .html
in the input filename.

Requirements: Python 3, the `markdown` package (pip install markdown)
"""

import markdown
import sys
import os


def convert(md_path, html_path=None):
    """Read a Markdown file and write a print-ready HTML document."""

    if html_path is None:
        html_path = os.path.splitext(md_path)[0] + '.html'

    with open(md_path, 'r') as f:
        md = f.read()

    html_body = markdown.markdown(
        md,
        extensions=['extra', 'smarty', 'codehilite'],
        output_format='html5'
    )

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{os.path.splitext(os.path.basename(md_path))[0]}</title>
<style>
  @page {{
    size: A4;
    margin: 2.5cm 2cm;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
  }}
  h1 {{
    font-size: 20pt;
    text-align: center;
    margin-top: 3cm;
    margin-bottom: 0.3cm;
    line-height: 1.3;
  }}
  h1 + p {{
    text-align: center;
    font-size: 10pt;
    color: #555;
  }}
  h2 {{
    font-size: 14pt;
    margin-top: 1.5cm;
    margin-bottom: 0.5cm;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
  }}
  h3 {{
    font-size: 12pt;
    margin-top: 1cm;
    margin-bottom: 0.3cm;
  }}
  h4 {{
    font-size: 11pt;
    margin-top: 0.7cm;
    margin-bottom: 0.2cm;
  }}
  p {{ margin: 0.4cm 0; text-align: justify; }}
  blockquote {{
    border-left: 3px solid #999;
    margin: 0.5cm 0;
    padding: 0.2cm 0.8cm;
    color: #444;
    font-style: italic;
  }}
  code {{
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 9.5pt;
    background: #f4f4f4;
    padding: 1px 4px;
    border-radius: 3px;
  }}
  pre {{
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px 12px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.4;
  }}
  pre code {{ background: none; padding: 0; border-radius: 0; }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 0.5cm 0;
    font-size: 10pt;
  }}
  th, td {{
    border: 1px solid #ccc;
    padding: 5px 8px;
    text-align: left;
  }}
  th {{ background: #f0f0f0; font-weight: bold; }}
  ul, ol {{ margin: 0.3cm 0; padding-left: 1.5em; }}
  li {{ margin: 0.15cm 0; }}
  hr {{
    border: none;
    border-top: 1px solid #ddd;
    margin: 1cm 0;
  }}
  em {{ font-style: italic; }}
  strong {{ font-weight: bold; }}
  a {{ color: #1a5276; text-decoration: underline; }}
  @media print {{
    body {{ padding: 0; max-width: none; }}
    h1 {{ margin-top: 2cm; }}
    pre {{ page-break-inside: avoid; }}
    table {{ page-break-inside: avoid; }}
    h2, h3 {{ page-break-after: avoid; }}
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>'''

    with open(html_path, 'w') as f:
        f.write(html)

    print(f'Written {len(html)} bytes to {html_path}')
    return html_path


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
