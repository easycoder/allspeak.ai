"""The runtime's own plugins, shipped inside the package.

`as_viz.py` lives here rather than beside the module because `flit` ships the `allspeak/` package and nothing
outside it: a plugin at `allspeak-py/plugins/` was in no release at all, and the CLI arms a recording by
importing it (`--record=<trace>`). User plugins still live in `allspeak-py/plugins/`.
"""
