# dialog

**Syntax:**
```
dialog VariableName
```

**Description:**
Declares a new dialog variable for use in the graphics environment. Dialogs are pop-up windows that can be used for user input, confirmation, or displaying information.

**Parameters:**
- `VariableName`: The name of the variable to hold the dialog widget.

**Example:**
```
dialog MyDialog
create MyDialog type confirm title 'Are you sure?'
show MyDialog
```

**Notes:**
- Dialogs can be created with different types (confirm, lineedit, multiline, file, save, generic).
- `file` and `save` are the OS's native choosers (open / save mode); `put {dialog} into V` after `show` gives the chosen path, or an empty string if the user cancelled. A `save` dialog does not create the file — the script writes it. Both accept `title` and `filter` (a Qt filter string such as `*.txt`).
- Use `show` to display the dialog.
- Dialogs can be customized with title, prompt, value, filter, and layout options.

Next: [disable](disable.md)  
Prev: [create](create.md)

[Back](../../README.md)
