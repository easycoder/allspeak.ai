# Feature requests

Features wished for while working on AllSpeak. Add a row when a task works around a missing feature, and review the list at the end of the session.

| Date | Area | Request | Workaround used | Status |
| --- | --- | --- | --- | --- |
| 2026-10-19 | AllSpeak JS dialect | Support `delete entry <key> of <dict>` (parity with the Python/CLI dialect). | `json delete property <key> of <dict>` in the rbr project's `device-editor.allspeak`. | Completed 2026-10-20 |
| 2026-11-06 | AllSpeak Python graphics | Native multi-row table/list selection. Two parts: a widget-level setting for single, contiguous or non-contiguous selection (PySide's `QAbstractItemView.SelectionMode` already provides `SingleSelection`, `ContiguousSelection`, `ExtendedSelection`, `MultiSelection`), and a way to read the whole selection — e.g. `put the selection of Table into RowSet`, where `RowSet` is a `list` of row indexes. A list covers all three cases, so no dictionary form is needed. `on click` should still fire for any selected row, with the clicked row and the full selection both readable in the handler. | The Studio adds a **Select rows** toggle that records clicked row indexes itself, paints the chosen rows, and feeds **Delete rows**. `ECTableWidget` hard-wires `SingleSelection`, and `the selected row of Table` reads `currentRow()`, so a script cannot see past one row. | Completed 2026-11-06 |
