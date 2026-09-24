#!/usr/bin/env python3
"""learn-link-check.py — validate cross-references in the Learn curriculum.

The Learn reader (learn/reader.as) resolves in-content links by *slug*: the
click shim in learn/index.html intercepts a relative `.md` link, strips the
directory, the `.md` suffix and any leading `NN-` prefix to form a bare slug,
and navigates to the manifest page with that slug (learn/manifest.json). The
as-written href (e.g. `../reference/13-plugins.md` or `plugins.md`) is only a
handle for the human reader — it is never fetched directly.

A relative `.md` link whose slug is NOT in the manifest is therefore broken in
the reader: it falls through to the browser and 404s (or, if the manifest
hasn't loaded, pops the reader's "Page not found" alert). This tool flags
those links, plus any other relative (non-external) link targets for manual
review, and guards the manifest itself (every page path must exist, slugs
unique).

Usage:
  learn-link-check.py [--root DIR]

  DIR defaults to `learn` (repo root relative). Exit codes:
    0  no errors
    1  errors found
    2  usage error
"""

import argparse
import json
import os
import re
import sys

# Root-level .md files that intentionally live outside the manifest (the
# reader leaves them to the browser, e.g. learn/README.md serves raw).
INTENTIONAL = {"README.md"}

INLINE_LINK = re.compile(r"\]\(\s*([^)\s]+)(?:\s+\"[^\"]*\")?\s*\)")
DEF_LINK = re.compile(r"^\[\S+\]:\s*(\S+)\s*$")


def reader_slug(href):
    """Mirror the shim's slug extraction: drop #fragment, then strip
    directory, `.md`, and any leading `NN-` prefix."""
    path = href.split("#", 1)[0]
    base = path.rsplit("/", 1)[-1]
    if not base.endswith(".md"):
        return None
    return re.sub(r"^\d+-", "", base[:-3])


def is_external(href):
    # Absolute paths (/codex.html) and full URLs are browser-handled —
    # the reader shim never sees them, same as external links.
    return href.startswith(("/", "http://", "https://", "mailto:", "tel:"))


def collect_links(root):
    """Yield (file, line_no, href) for every link target in the .md files."""
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for name in sorted(filenames):
            if not name.endswith(".md"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as fh:
                for i, line in enumerate(fh, 1):
                    for href in INLINE_LINK.findall(line):
                        yield path, i, href
                    m = DEF_LINK.match(line)
                    if m:
                        yield path, i, m.group(1)


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default="learn", help="curriculum dir (default: learn)")
    args = ap.parse_args(argv)

    manifest_path = os.path.join(args.root, "manifest.json")
    if not os.path.isfile(manifest_path):
        sys.stderr.write(f"error: no manifest at {manifest_path}\n")
        return 2
    manifest = json.load(open(manifest_path, encoding="utf-8"))

    slugs = {}
    errors, infos = [], []
    for page in manifest.get("pages", []):
        slug, path = page.get("slug"), page.get("path")
        if not slug or not path:
            errors.append((manifest_path, 0, f"manifest page missing slug/path: {page!r}"))
            continue
        if slug in slugs:
            errors.append((manifest_path, 0, f"duplicate slug in manifest: {slug}"))
        slugs[slug] = path
        if not os.path.isfile(os.path.join(args.root, path)):
            errors.append((manifest_path, 0, f"manifest page path missing on disk: {path}"))

    for path, line, href in collect_links(args.root):
        rel = os.path.relpath(path, args.root)
        where = f"{rel}:{line}"
        if is_external(href) or href.startswith("#"):
            continue  # external links and same-page anchors are browser-handled
        slug = reader_slug(href)
        if slug is None:
            # Relative but not a .md page link (e.g. ../../codex): browser
            # follows it; surface for manual review.
            infos.append((where, f"relative non-.md target (browser-follow): {href}"))
        elif slug not in slugs:
            base = href.split("#", 1)[0].rsplit("/", 1)[-1]
            if base in INTENTIONAL:
                infos.append((where, f"intentional non-manifest .md target: {href}"))
            else:
                errors.append((where, f".md target slug not in manifest: {href} -> `{slug}`"))

    for where, msg in infos:
        print(f"info: {where}: {msg}")
    for where, msg in errors:
        print(f"error: {where}: {msg}")
    print(f"{len(errors)} error(s), {len(infos)} info(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
