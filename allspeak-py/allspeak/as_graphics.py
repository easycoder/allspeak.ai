import sys
import json
from .as_handler import Handler
from .as_language import language
from .as_classes import (
    FatalError,
    RuntimeError,
    ECValue
)
from .as_gclasses import (
    ECWidget,
    ECCoreWidget,
    ECLayout,
    ECGroup,
    ECPanel,
    ECLabel,
    ECPushButton,
    ECCheckBox,
    ECLineInput,
    ECMultiline,
    ECMDPanel,
    ECListBox,
    ECComboBox,
    ECWindow,
    ECDialog,
    ECMessageBox,
    ECShape,
    ECTable,
    ECLog,
    ECPanes,
    ECTabs,
)
from .as_border import Border
from .as_keyboard import Keyboard, TextReceiver
from .debugger.as_debug import Debugger
from PySide6.QtCore import Qt, QTimer, Signal, QRect
from PySide6.QtGui import QPixmap, QPainter, QPen, QBrush, QColor, QTextDocument, QFontDatabase, QTextCursor, QTextCharFormat
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDateEdit,
    QDateTimeEdit,
    QDial,
    QDoubleSpinBox,
    QFontComboBox,
    QLabel,
    QLCDNumber,
    QLineEdit,
    QPlainTextEdit,
    QTextEdit,
    QListWidget,
    QMainWindow,
    QProgressBar,
    QPushButton,
    QRadioButton,
    QSlider,
    QSpinBox,
    QTimeEdit,
    QTableWidget,
    QTableWidgetItem,
    QHeaderView,
    QAbstractItemView,
    QSplitter,
    QTabWidget,
    QLayout,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QStackedLayout,
    QGroupBox,
    QWidget,
    QSpacerItem,
    QSizePolicy,
    QDialog,
    QMessageBox,
    QDialogButtonBox,
    QFileDialog,
    QGraphicsDropShadowEffect
)
from allspeak.as_program import flush

# The cursor names a script can write, and the Qt cursor each one sets. **The list is the same in
# both flavours of AllSpeak** — js/allspeak/Browser.js holds the other copy — so a script that sets a
# cursor runs on either without changing a word. `arrow` and `hand` are the words people reach for;
# Qt, like CSS, spells those two `ArrowCursor` and `PointingHandCursor`.
CURSORS = {
    'arrow': Qt.CursorShape.ArrowCursor,
    'hand': Qt.CursorShape.PointingHandCursor,
    'wait': Qt.CursorShape.WaitCursor,
    'progress': Qt.CursorShape.BusyCursor,
    'text': Qt.CursorShape.IBeamCursor,
    'move': Qt.CursorShape.SizeAllCursor,
    'crosshair': Qt.CursorShape.CrossCursor,
    'help': Qt.CursorShape.WhatsThisCursor,
    'not-allowed': Qt.CursorShape.ForbiddenCursor,
    'grab': Qt.CursorShape.OpenHandCursor,
    'grabbing': Qt.CursorShape.ClosedHandCursor,
    'none': Qt.CursorShape.BlankCursor,
}

class ECLabelWidget(QLabel):
    def __init__(self, text=None):
        super().__init__(text)
        self.setStyleSheet("""
            background-color: transparent;
            border: none;
        """)

#############################################################################
# EC Pushbutton widget class
class ECPushButtonWidget(QPushButton):
    def __init__(self, text=None):
        super().__init__(text)
#        self.clicked.connect(self.handleClick)
    
    def getContent(self):
        return self.text()

#    def setOnClick(self, cb):
#        self.clicked.connect(cb)
    
#    def handleClick(self):
#        pass

#############################################################################
# EC Checkbox widget class
class ECCheckBoxWidget(QCheckBox):
    def __init__(self, text=None):
        super().__init__(text)
        self.setStyleSheet("""
            QCheckBox::indicator {
                border: 1px solid black;
                border-radius: 3px;
                background: white;
                width: 16px;
                height: 16px;
            }
            QCheckBox::indicator:checked {
                background: #0078d7;
            }
            QCheckBox {
                border: none;
                background: transparent;
            }
        """)

#############################################################################
# EC line edit widget class
class ECLineEditWidget(QLineEdit):
    clicked = Signal()

    def __init__(self):
        super().__init__()
        self.multiline = False
        self.container = None
    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# EC shape widget class — a QWidget that paints a rect / roundrect /
# ellipse / circle fill with an optional border. Painted (rather than
# QSS) because Qt stylesheets have no percentage border-radius, so an
# ellipse or circle can't be expressed as a stylesheet string.
class ECShapeWidget(QWidget):
    def __init__(self, kind='roundrect', radius=12, fill='#FFFFFF', border=None, borderwidth=0):
        super().__init__()
        self.kind = kind
        self.radius = radius
        self.fill = fill
        self.border = border
        self.borderwidth = borderwidth

    def setKind(self, kind):
        self.kind = kind
        self.update()

    def setRadius(self, radius):
        self.radius = radius
        self.update()

    def setFill(self, fill):
        self.fill = fill
        self.update()

    def setBorder(self, border):
        self.border = border
        self.update()

    def setBorderWidth(self, borderwidth):
        self.borderwidth = borderwidth
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        pen = QPen(QColor(self.border), self.borderwidth) if self.border else QPen(Qt.PenStyle.NoPen)
        painter.setPen(pen)
        painter.setBrush(QBrush(QColor(self.fill)))
        rect = self.rect().adjusted(self.borderwidth, self.borderwidth, -self.borderwidth, -self.borderwidth)
        if rect.width() <= 0 or rect.height() <= 0:
            return
        if self.kind == 'rect':
            painter.drawRect(rect)
        elif self.kind == 'ellipse':
            painter.drawEllipse(rect)
        elif self.kind == 'circle':
            side = min(rect.width(), rect.height())
            circle = QRect(0, 0, side, side)
            circle.moveCenter(rect.center())
            painter.drawEllipse(circle)
        else:  # roundrect
            painter.drawRoundedRect(rect, self.radius, self.radius)
        painter.end()

#############################################################################
# EC plain text edit widget class
class ECPlainTextEditWidget(QPlainTextEdit):
    clicked = Signal()

    def __init__(self):
        super().__init__()
        self.multiline = True
        self.container = None

    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# How the markdown panel is told to read its text: the GitHub dialect, with HTML left out of it.
#
# Qt's markdown importer takes a tag it meets for an element, and an element it has no format for
# contributes none of its text — so an *unpaired* tag, which is never closed, takes the rest of the
# document with it. Measured 2026-10-14 on this widget: a `<person>` left in the middle of a
# six-section conversation log emptied every paragraph below it, and a bare `<br>` — the one tag any
# hand-written markdown file may carry — does the same on its own. Only the runs carrying a format of
# their own (code spans, headings, an explicit `</close>`) still came through.
#
# `MarkdownNoHTML` keeps the dialect and drops the HTML, so a tag reaches the reader as the text it
# was written as and nothing after it is lost. That is what the browser runtime's markdown renderer
# already does — `MarkdownRenderer.js` escapes HTML before converting it — so the two runtimes agree,
# and it is what a viewer opened on a file from outside this project needs, since no author can be
# asked to pair every tag they write.
MARKDOWN_FEATURES = QTextDocument.MarkdownFeature.MarkdownDialectGitHub | QTextDocument.MarkdownFeature.MarkdownNoHTML

#############################################################################
# EC MDPanel widget class
class ECMDPanelWidget(QTextEdit):
    clicked = Signal()
    
    # Font size configuration - adjust this value to experiment with different sizes
    FONT_SIZE = 12  # Default is typically 9-10, try 12, 14, 16, or 18

    def __init__(self):
        super().__init__()
        self.multiline = True
        self.container = None
        self.setReadOnly(True)  # Make it read-only for preview
        
        # Set the font size
        font = self.font()
        font.setPointSize(self.FONT_SIZE)
        self.setFont(font)

    # Read markdown the way `MARKDOWN_FEATURES` says. Every caller arrives here — the script's
    # `set the text of`, which is the only way a panel is given text — so what a file looks like on
    # screen is decided in this one place rather than at each call site.
    #
    # The features go to the document rather than to `QTextEdit.setMarkdown`, which takes only the
    # text: Qt's own method is the one-argument shorthand for `document().setMarkdown(text)`.
    def setMarkdown(self, markdown):
        self.document().setMarkdown(markdown, MARKDOWN_FEATURES)

    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# EC table widget class — a read-only grid with per-cell text, colour, tooltip and
# alignment. Row selection is the default because the studio's step table selects a
# step; the cell under a click is kept separately so a click handler can name it.
class ECTableWidget(QTableWidget):

    def __init__(self):
        super().__init__()
        self.clickedRow = -1
        self.clickedColumn = -1
        self.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.verticalHeader().setVisible(False)

#############################################################################
# EC log widget class — a read-only, no-wrap, monospace view that appends a line at a
# time and follows the end. `appendLine` takes an optional foreground colour, which is
# how a log line is tinted (an error in red) without a second widget.
class ECLogWidget(QPlainTextEdit):

    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setLineWrapMode(QPlainTextEdit.LineWrapMode.NoWrap)
        font = QFontDatabase.systemFont(QFontDatabase.SystemFont.FixedFont)
        font.setPointSize(10)
        self.setFont(font)

    def appendLine(self, text, color=None):
        cursor = self.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        # A line starts a new paragraph unless it is the first; inserting straight at
        # the end of the last block would run the new line into it.
        if not self.document().isEmpty():
            cursor.insertBlock()
        if color:
            fmt = QTextCharFormat()
            fmt.setForeground(QBrush(QColor(str(color))))
            cursor.insertText(str(text), fmt)
        else:
            cursor.insertText(str(text))
        self.setTextCursor(cursor)
        self.ensureCursorVisible()

#############################################################################
# EC Listbox widget class
class ECListBoxWidget(QListWidget):
    def __init__(self, text=None):
        super().__init__(text)
    
    def text(self):
        return self.currentItem().text()

#############################################################################
# EC ComboBox widget class
class ECComboBoxWidget(QComboBox):
    def __init__(self, text=None):
        super().__init__(text)
    
    def text(self):
        return self.currentText()

#############################################################################
# EC window class — a QMainWindow that can report its own close event, so a
# script's `on close {window}` handler runs in time to save state before the
# runtime ends the program as its last window goes. Without this hook the
# only sight of a closing window is QApplication.lastWindowClosed, which
# fires after every window has gone.
class ECWindowWidget(QMainWindow):
    def __init__(self):
        super().__init__()
        self.onClose = None

    def setOnClose(self, callback):
        self.onClose = callback

    def closeEvent(self, event):
        if self.onClose is not None:
            self.onClose()
        super().closeEvent(event)

#############################################################################
# EC dialog class
class ECDialogWindow(QDialog):
    clicked = Signal()

    def __init__(self, window):
        super().__init__(window)
        self.multiline = True
        self.container = None
    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

###############################################################################
class Graphics(Handler):

    def __init__(self, compiler):
        super().__init__(compiler)
        self.blocked = False
        self.runOnTick = 0
        self.vkb = False
        self.flushRunning = False
        self.flushSkipCount = 0
        self.tickBusySkipCount = 0

    def getName(self):
        return 'graphics'
    
    # Turn an evaluated value into a list of display strings. A value of list
    # type (whose content may be a JSON string, as ECVariable stores it, or a
    # raw Python list, as ECList stores it) is spread into its items; anything
    # else is a single item. Used by `add {value} to {listbox|combobox}` and
    # `set {listbox} to {list}`.
    def listItems(self, value):
        if isinstance(value, list):
            return [self.textify(item) for item in value]
        if isinstance(value, ECValue) and value.getType() == 'list':
            content = value.getContent()
            if isinstance(content, str):
                try: content = json.loads(content)
                except Exception: content = [content]
            if isinstance(content, list):
                return [self.textify(item) for item in content]
        return [self.textify(value)]
    
    def isCoreWidget(self, object):
        if isinstance(object, dict): object = object['object']
        return isinstance(object, ECCoreWidget)
    
    # Set a graphic element as the value of a record
    def setGraphicElement(self, record, element):
        object = self.getObject(record)
        object.setValue(element)

    def dialogTypes(self):
        return ['confirm', 'lineedit', 'multiline', 'generic', 'file', 'save']
    
    #############################################################################
    # Keyword handlers

    # (1) add {value} to {widget}
    # (2) add {widget} to {layout}
    # (3) add stretch {widget} to {layout}
    # (4) add stretch to {layout}
    # (5) add spacer [size] {size} to {layout}
    # (6) add {widget} at {col} {row} in {grid layout}
    def k_add(self, command):

        # Add to a layout, group, shape, pane set, tab set, list or combo box
        def addToLayout():
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                object = self.getObject(record)
                self.checkObjectType(record, (ECLayout, ECGroup, ECShape, ECListBox, ECComboBox, ECPanes, ECTabs))
                command['target'] = record['name']
                # A tab page carries its label: `add Steps to Views as `Steps``
                if self.isObjectType(record, ECTabs):
                    if language.reverse_word(self.peek() or '') in ('as', 'title'):
                        self.nextToken()
                        command['title'] = self.nextValue()
                self.add(command)
                return True
            return False
        
        token = self.peek()
        if token == 'stretch':
            self.nextToken()
            # It's either (3) or (4)
            if self.nextIsWord('to'):
                # (4)
                command['stretch'] = False
                command['widget'] = 'stretch'
                return addToLayout()
            if self.isSymbol():
                # (3)
                record = self.getSymbolRecord()
                command['widget'] = record['name']
                command['stretch'] = True
                if self.nextIsWord('to'):
                    return addToLayout()
            return False
        
        elif token == 'spacer':
            self.nextToken()
            self.skipWord('size')
            command['widget'] = 'spacer'
            command['size'] = self.nextValue()
            self.skipWord('to')
            return addToLayout()

        # Here it's either (1), (2) or (6)
        elif self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWidget):
                # It's either (2), (6) or (1)
                command['widget'] = record['name']
                if language.matches_word(self.peek(), 'to'):
                    # (2)
                    record = self.getSymbolRecord()
                    domainName = record['domain']
                    if domainName != self.getName():
                        domain = self.program.domainIndex[domainName]
                        handler = domain.keywordHandler('add')
                        return handler(command)
                    self.nextToken()
                    return addToLayout()
                elif language.reverse_word(self.peek()) == 'at':
                    # (6) add {widget} at {col} {row} in {grid layout}
                    self.nextToken()
                    command['col'] = self.nextValue()
                    command['row'] = self.nextValue()
                    self.skipWord('in')
                    return addToLayout()
            else:
                # It's (1) with a non-widget variable
                command['value'] = self.getValue()
                self.skipWord('to')
                return addToLayout()

        # (1) with a value
        value = self.getValue()
        if value == None: return False
        command['value'] = value
        self.skipWord('to')
        return addToLayout()
    
    def r_add(self, command):
        if 'value' in command:
            record = self.getVariable(command['target'])
            object = self.getObject(record)
            value = self.evaluate(command['value'])
            widget = self.getInnerObject(record)
            if isinstance(object, (ECListBox, ECComboBox)):
                for item in self.listItems(value):
                    widget.addItem(item)  # type: ignore
        elif 'row' in command and 'col' in command:
            layout = self.getInnerObject(self.getVariable(command['target']))
            record = self.getVariable(command['widget'])
            widget = self.getInnerObject(record)
            row = self.textify(command['row'])
            col = self.textify(command['col'])
            if self.isObjectType(record, ECLayout):
                layout.addLayout(widget, row, col)
            else:
                layout.addWidget(widget, row, col)
        else:
            widget = command['widget']
            targetRecord = self.getVariable(command['target'])
            if widget == 'stretch':
                self.getInnerObject(targetRecord).addStretch()  # type: ignore
            elif widget == 'spacer':
                self.getInnerObject(targetRecord).addSpacing(self.textify(command['size']))  # type: ignore
            else:
                widgetRecord = self.getVariable(widget)
                self.checkObjectType(widgetRecord, ECCoreWidget)
                stretch = 'stretch' in command
                if self.isObjectType(targetRecord, ECPanes):
                    # add {widget|layout} to {panes}: a splitter holds widgets; a
                    # layout is wrapped in one, which is what a pane is.
                    panes = self.getInnerObject(targetRecord)
                    panes.addWidget(self.pageWidget(widgetRecord))  # type: ignore
                elif self.isObjectType(targetRecord, ECTabs):
                    # add {widget|layout} to {tabs} [as {title}]
                    tabs = self.getInnerObject(targetRecord)
                    title = self.textify(command['title']) if 'title' in command else widget
                    tabs.addTab(self.pageWidget(widgetRecord), str(title))  # type: ignore
                elif self.isObjectType(targetRecord, ECGroup):
                    # add {widget} to {group}: the widget goes into the
                    # group's own layout. A plain QVBoxLayout is created on
                    # first use. add {layout} to {group} sets the group's
                    # layout instead.
                    group = self.getInnerObject(targetRecord)
                    if self.isObjectType(widgetRecord, ECLayout):
                        group.setLayout(self.getInnerObject(widgetRecord))  # type: ignore
                    else:
                        groupLayout = group.layout()  # type: ignore
                        if groupLayout is None:
                            groupLayout = QVBoxLayout()
                            group.setLayout(groupLayout)  # type: ignore
                        groupLayout.addWidget(self.getInnerObject(widgetRecord), 1 if stretch else 0)  # type: ignore
                elif self.isObjectType(targetRecord, ECShape):
                    # add {widget} to {shape}: like a group, an inner layout is
                    # created on first use, with contents margins matching the
                    # corner radius so children sit inside the rounded area.
                    shape = self.getInnerObject(targetRecord)
                    if self.isObjectType(widgetRecord, ECLayout):
                        shape.setLayout(self.getInnerObject(widgetRecord))  # type: ignore
                    else:
                        shapeLayout = shape.layout()  # type: ignore
                        if shapeLayout is None:
                            shapeLayout = QVBoxLayout()
                            margin = max(self.getInnerObject(targetRecord).radius, 0)  # type: ignore
                            shapeLayout.setContentsMargins(margin, margin, margin, margin)
                            shape.setLayout(shapeLayout)  # type: ignore
                        shapeLayout.addWidget(self.getInnerObject(widgetRecord), 1 if stretch else 0)  # type: ignore
                else:
                    layoutRecord = targetRecord
                    self.checkObjectType(layoutRecord, ECLayout)
                    widget = self.getInnerObject(widgetRecord)
                    layout = self.getInnerObject(layoutRecord)
                    if self.isObjectType(widgetRecord, ECLayout):
                        if stretch: layout.addLayout(widget, stretch=1)  # type: ignore
                        else: layout.addLayout(widget)  # type: ignore
                    else:
                        if stretch: layout.addWidget(widget, stretch=1)  # type: ignore
                        else: layout.addWidget(widget)  # type: ignore
        return self.nextPC()

    # A splitter and a tab widget hold widgets, not layouts; a layout handed to one is
    # wrapped in a plain QWidget, which is what a pane or a page is.
    def pageWidget(self, record):
        inner = self.getInnerObject(record)
        if isinstance(inner, QLayout):
            holder = QWidget()
            holder.setLayout(inner)
            return holder
        return inner

    # append {value} to {logpane} [with color {color}]
    #
    # Core's `append` hands a target that is not a list or queue to its own domain; by
    # then the value is compiled and the cursor is on the log pane. The direct form is
    # parsed here too, so the handler is complete on its own.
    def k_append(self, command):
        if 'value' not in command:
            command['value'] = self.nextValue()
            if not self.nextIsWord('to'):
                return False
            self.nextToken()
        record = self.getSymbolRecord()
        if not self.isObjectType(record, ECLog):
            return False
        command['target'] = record['name']
        if language.reverse_word(self.peek() or '') == 'with':
            self.nextToken()
            self.skip(['colour', 'color', 'foreground'])
            command['color'] = self.nextValue()
        self.add(command)
        return True

    def r_append(self, command):
        record = self.getVariable(command['target'])
        widget = self.getInnerObject(record)
        color = self.textify(command['color']) if 'color' in command else None
        widget.appendLine(self.textify(command['value']), color)  # type: ignore
        return self.nextPC()

    # adjust {window}
    def k_adjust(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['window'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_adjust(self, command):
        object = self.getVariable(command['window'])['object']
        self.checkObjectType(object, ECWindow)
        window = self.getInnerObject(object)
        window.adjustSize()
        return self.nextPC()

    # Center one window on another
    # center {window2} on {window1}
    def k_center(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['window2'] = record['name']
                self.skipWord('on')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECWindow):
                        command['window1'] = record['name']
                        self.add(command)
                        return True
        return False
    
    def k_centre(self,command):
        return self.k_center(command)
    
    def r_center(self, command):
        object = self.getVariable(command['window1'])['object']
        self.checkObjectType(object, ECWindow)
        window1 = self.getInnerObject(object)
        object = self.getVariable(command['window2'])['object']
        self.checkObjectType(object, ECWindow)
        window2 = self.getInnerObject(object)
        geo1 = window1.geometry() # type: ignore
        geo2 = window2.geometry() # type: ignore
        geo2.moveCenter(geo1.center())
        window2.setGeometry(geo2) # type: ignore
        return self.nextPC()

    # Declare a checkbox variable
    def k_checkbox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECCheckBox')

    def r_checkbox(self, command):
        return self.nextPC()

    # clear {window/widget}
    def k_clear(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            object = self.getObject(record)
            if object.isCoreClass():
                if object.isClearable():
                    command['name'] = record['name']
                    self.add(command)
                    return True
                raise FatalError(self.compiler, f'The object {record["name"]} is not clearable')
        return False
    
    def r_clear(self, command):

        def clearLayout(layout: QLayout) -> None:
            """Recursively clear all items from a layout."""
            if layout is None:
                return
            while layout.count() > 0:
                item = layout.takeAt(0)
                if item is None:
                    continue
                widget = item.widget()
                if widget is not None:
                    widget.deleteLater()
                elif item.layout() is not None:
                    clearLayout(item.layout())
                    item.layout().deleteLater()

        def clearWidget(widget: QWidget) -> None:
            """Clear all contents from a widget."""
            if widget is None:
                return
            if isinstance(widget, (QListWidget, QComboBox)):
                if isinstance(widget, QListWidget):
                    for i in range(widget.count()):
                        item_widget = widget.itemWidget(widget.item(i))
                        if item_widget:
                            item_widget.deleteLater()
                widget.clear()
                return
            if isinstance(widget, QTableWidget):
                # The columns stay: they are the table's shape, and `clear` is about
                # the rows its data put there.
                widget.setRowCount(0)
                return
            if isinstance(widget, QTabWidget):
                while widget.count():
                    widget.removeTab(0)
                return
            if isinstance(widget, QSplitter):
                while widget.count():
                    widget.widget(0).setParent(None)
                return
            if isinstance(widget, QPlainTextEdit):
                widget.clear()
                return
            layout = widget.layout()
            if layout is not None:
                clearLayout(layout)
                layout.deleteLater()
            child_widgets = widget.findChildren(QWidget, "", Qt.FindChildOption.FindDirectChildrenOnly)
            for child in child_widgets:
                child.deleteLater()

        element = self.getInnerObject(self.getVariable(command['name']))
        if isinstance(element, QLayout):
            clearLayout(element)  # type: ignore
        else:
            clearWidget(element)  # type: ignore
        return self.nextPC()

    # close {window}
    def k_close(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['name'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_close(self, command):
        record = self.getVariable(command['name'])
        window = self.getInnerObject(record)
        self.checkObjectType(window, QMainWindow)
        window.close()  # type: ignore
        return self.nextPC()

    # Declare a combobox variable
    def k_combobox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECComboBox')

    def r_combobox(self, command):
        return self.nextPC()

    # Create a window
    def k_createWindow(self, command):
        title = None
        x = None
        y = None
        w = self.compileConstant(640)
        h = self.compileConstant(480)
        while True:
            token = self.peek()
            if token in ['title', 'at', 'size', 'layout']:
                self.nextToken()
                if token == 'title': title = self.nextValue()
                elif token == 'at':
                    x = self.nextValue()
                    y = self.nextValue()
                elif token == 'size':
                    w = self.nextValue()
                    h = self.nextValue()
                elif token == 'layout':
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECLayout):
                            command['layout'] = record['name']
                else: return False
            else: break
        command['title'] = title
        command['x'] = x
        command['y'] = y
        command['w'] = w
        command['h'] = h
        self.add(command)
        return True

    # Create a widget
    def k_createLayout(self, command):
        self.skipWord('type')
        command['type'] = self.nextToken()
        self.add(command)
        return True

    def k_createGroupBox(self, command):
        if language.reverse_word(self.peek()) == 'title':
            self.nextToken()
            title = self.nextValue()
        else: title = ''
        command['title'] = title
        self.add(command)
        return True

    def k_createLabel(self, command):
        text = self.compileConstant('')
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                text = self.nextValue()
            elif token == 'size':
                self.nextToken()
                command['size'] = self.nextValue()
            elif token == 'width':
                self.nextToken()
                command['width'] = self.nextValue()
            elif token == 'expand':
                self.nextToken()
                command['expand'] = True
            elif token == 'align':
                self.nextToken()
                token = self.nextToken()
                if token in ['left', 'right', 'center', 'centre', 'justify']:
                    command['align'] = token
            else: break
        command['text'] = text
        self.add(command)
        return True

    def k_createPushbutton(self, command):
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                command['text'] = self.nextValue()
            elif token == 'icon':
                self.nextToken()
                command['icon'] = self.nextValue()
            elif token == 'size':
                self.nextToken()
                command['size'] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createCheckBox(self, command):
        if language.reverse_word(self.peek()) == 'text':
            self.nextToken()
            text = self.nextValue()
        else: text = self.compileConstant('')
        command['text'] = text
        self.add(command)
        return True

    def k_createLineEdit(self, command):
        text = self.compileConstant('')
        size = self.compileConstant(40)
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                text = self.nextValue()
            elif token == 'size':
                self.nextToken()
                size = self.nextValue()
            else: break;
        command['size'] = size
        command['text'] = text
        self.add(command)
        return True

    def k_createMultiLineEdit(self, command):
        while True:
            next = self.peek()
            if next == 'cols':
                self.nextToken()
                command['cols'] = self.nextValue()
            elif next == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            elif next == 'readonly':
                # `create {multiline} readonly` builds the field as a
                # read-only plain-text view: the same widget, but the user
                # cannot type into it. `set the text of` still writes to it.
                self.nextToken()
                command['readonly'] = True
            else: break;
        self.add(command)
        return True

    def k_createMDPanel(self, command):
        while True:
            next = self.peek()
            if next == 'cols':
                self.nextToken()
                command['cols'] = self.nextValue()
            elif next == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            else: break;
        self.add(command)
        return True

    def k_createListBox(self, command):
        self.add(command)
        return True

    def k_createComboBox(self, command):
        self.add(command)
        return True

    def k_createPanel(self, command):
        self.add(command)
        return True

    def k_createShape(self, command):
        # `type` selects the geometry and defaults to roundrect; all
        # attributes are optional. `width` is deliberately not used here —
        # it means widget width elsewhere, so border thickness is `borderwidth`.
        command['type'] = 'roundrect'
        command['radius'] = 12
        while True:
            token = self.peek()
            if token == 'type':
                self.nextToken()
                command['type'] = self.nextToken()
            elif token == 'radius':
                self.nextToken()
                command['radius'] = self.nextValue()
            elif token == 'fill':
                self.nextToken()
                command['fill'] = self.nextValue()
            elif token == 'border':
                self.nextToken()
                command['border'] = self.nextValue()
            elif token == 'borderwidth':
                self.nextToken()
                command['borderwidth'] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createTable(self, command):
        # The columns' labels come from `set columns of`; `columns` here just reserves
        # the count, for a table whose headings are filled in later.
        while True:
            token = self.peek()
            if token == 'columns':
                self.nextToken()
                command['columns'] = self.nextValue()
            elif token == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createLog(self, command):
        # A log is read-only by construction; `cols`/`rows` fix its size the way they
        # do for a multiline field, and without them it fills its container.
        while True:
            token = self.peek()
            if token == 'cols':
                self.nextToken()
                command['cols'] = self.nextValue()
            elif token == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createPanes(self, command):
        # create Work [orientation horizontal|vertical]
        command['orientation'] = 'horizontal'
        while True:
            token = self.peek()
            if token == 'orientation':
                self.nextToken()
                command['orientation'] = self.nextToken()
            else: break
        self.add(command)
        return True

    def k_createTabs(self, command):
        while True:
            token = self.peek()
            if token in ('cols', 'rows'):
                self.nextToken()
                command[token] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createDialog(self, command):
        if language.reverse_word(self.peek()) == 'on':
            self.nextToken()
            if self.nextIsSymbol():
                command['window'] = self.getSymbolRecord()['name']
        else: command['window'] = None
        while True:
            if language.reverse_word(self.peek()) == 'type':
                self.nextToken()
                dialogType = self.nextToken()
                if dialogType in self.dialogTypes(): command['type'] = dialogType
                else: return False
            elif language.reverse_word(self.peek()) == 'title':
                self.nextToken()
                command['title'] = self.nextValue()
            elif language.reverse_word(self.peek()) == 'prompt':
                self.nextToken()
                command['prompt'] =  self.nextValue()
            elif language.reverse_word(self.peek()) == 'value':
                self.nextToken()
                command['value'] =  self.nextValue()
            elif language.reverse_word(self.peek()) == 'filter':
                # Native choosers take a Qt filter string, e.g. `*.txt` or
                # `Texts (*.txt);;All files (*)`. Passed through unchanged;
                # only the `file` and `save` types use it.
                self.nextToken()
                command['filter'] = self.nextValue()
            elif language.reverse_word(self.peek()) == 'with':
                self.nextToken()
                command['layout'] =  self.nextToken()
            else: break
        if not 'title' in command: command['title'] = self.compileConstant('')
        if not 'value' in command: command['value'] = self.compileConstant('')
        if not 'prompt' in command: command['prompt'] = self.compileConstant('')
        self.add(command)
        return True

    def k_createMessageBox(self, command):
        if language.reverse_word(self.peek()) == 'on':
            self.nextToken()
            if self.nextIsSymbol():
                command['window'] = self.getSymbolRecord()['name']
        else: command['window'] = None
        style = 'question'
        title = ''
        message = ''
        while True:
            if language.reverse_word(self.peek()) == 'style':
                self.nextToken()
                style = self.nextToken()
            elif language.reverse_word(self.peek()) == 'title':
                self.nextToken()
                title = self.nextValue()
            elif language.reverse_word(self.peek()) == 'message':
                self.nextToken()
                message = self.nextValue()
            else: break
        command['style'] = style
        command['title'] = title
        command['message'] = message
        self.add(command)
        return True

    def k_create(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            keyword = record['keyword']
            if keyword == 'window': return self.k_createWindow(command)
            elif keyword == 'layout': return self.k_createLayout(command)
            elif keyword == 'group': return self.k_createGroupBox(command)
            elif keyword == 'label': return self.k_createLabel(command)
            elif keyword == 'pushbutton': return self.k_createPushbutton(command)
            elif keyword == 'checkbox': return self.k_createCheckBox(command)
            elif keyword == 'lineinput': return self.k_createLineEdit(command)
            elif keyword == 'multiline': return self.k_createMultiLineEdit(command)
            elif keyword == 'mdpanel': return self.k_createMDPanel(command)
            elif keyword == 'listbox': return self.k_createListBox(command)
            elif keyword == 'combobox': return self.k_createComboBox(command)
            elif keyword == 'panel': return self.k_createPanel(command)
            elif keyword == 'shape': return self.k_createShape(command)
            elif keyword == 'table': return self.k_createTable(command)
            elif keyword == 'logpane': return self.k_createLog(command)
            elif keyword == 'panes': return self.k_createPanes(command)
            elif keyword == 'tabs': return self.k_createTabs(command)
            elif keyword == 'dialog': return self.k_createDialog(command)
            elif keyword == 'messagebox': return self.k_createMessageBox(command)
        return False
    
    def r_createWindow(self, command, record):
        window = ECWindowWidget()
        title = self.textify(command['title'])
        if title == None: title = 'AllSpeak Main Window'
        window.setWindowTitle(title)
        w = self.textify(command['w'])
        h = self.textify(command['h'])
        x = command['x']
        y = command['y']
        if hasattr(self.program, 'screenWidth'): screenWidth = self.program.screenWidth
        else: screenWidth = self.program.parent.program.screenWidth
        if hasattr(self.program, 'screenHeight'): screenHeight = self.program.screenHeight
        else: screenHeight = self.program.parent.program.screenHeight
        if x == None: x = (screenWidth - w) / 2
        else: x = self.textify(x)
        if y == None: y = (screenHeight - h) / 2
        else: y = self.textify(y)
        window.setGeometry(x, y, w, h)
        # A `layout` attribute on `create` is honoured here, using the same
        # wiring as `set the layout of {window} to {layout}`.
        if 'layout' in command:
            layoutRecord = self.getVariable(command['layout'])
            layoutObject = layoutRecord['object']
            self.checkObjectType(layoutObject, ECLayout)
            container = QWidget()
            container.setLayout(self.getInnerObject(layoutObject))
            window.setCentralWidget(container)
        self.setGraphicElement(record, window)
        return self.nextPC()
    
    def r_createLayout(self, command, record):
        layoutType = command['type']
        if layoutType == 'QHBoxLayout': layout = QHBoxLayout()
        elif layoutType == 'QGridLayout': layout = QGridLayout()
        elif layoutType == 'QStackedLayout': layout = QStackedLayout()
        else: layout = QVBoxLayout()
        layout.setContentsMargins(5,0,5,0)
        self.setGraphicElement(record, layout)
        return self.nextPC()
    
    def r_createGroupBox(self, command, record):
        group = QGroupBox(self.textify(command['title']))
        group.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.setGraphicElement(record, group)
        return self.nextPC()
    
    def r_createLabel(self, command, record):
        label = ECLabelWidget(str(self.textify(command['text'])))
        if 'size' in command:
            fm = label.fontMetrics()
            c = label.contentsMargins()
            w = fm.horizontalAdvance('m') * self.textify(command['size']) +c.left()+c.right()
            label.setMaximumWidth(w)
        if 'width' in command:
            label.setFixedWidth(self.textify(command['width']))
        if 'align' in command:
            alignment = command['align']
            if alignment == 'left': label.setAlignment(Qt.AlignmentFlag.AlignLeft)
            elif alignment == 'right': label.setAlignment(Qt.AlignmentFlag.AlignRight)
            elif alignment in ['center', 'centre']: label.setAlignment(Qt.AlignmentFlag.AlignHCenter)
            elif alignment == 'justify': label.setAlignment(Qt.AlignmentFlag.AlignJustify)
        if 'expand' in command:
            label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)
        self.setGraphicElement(record, label)
        return self.nextPC()
    
    def r_createPushbutton(self, command, record):
        if 'size' in command:
            size = self.textify(command['size'])
        else: size = None
        if 'icon' in command:
            iconPath = self.textify(command['icon'])
            pixmap = QPixmap(iconPath)
            if pixmap.isNull():
                RuntimeError(self.program, f'Icon not found: {iconPath}')
            icon = pixmap.scaledToHeight(size if size != None else 24, Qt.TransformationMode.SmoothTransformation)
            pushbutton = ECPushButtonWidget()
            pushbutton.setIcon(icon) # type: ignore
            pushbutton.setIconSize(icon.size()) # type: ignore
        elif 'text' in command:
            text = self.textify(command['text'])
            pushbutton = ECPushButtonWidget(text)
            pushbutton.setAccessibleName(text)
            if size != None:
                fm = pushbutton.fontMetrics()
                c = pushbutton.contentsMargins()
                w = fm.horizontalAdvance('m') * self.textify(command['size']) + c.left()+c.right()
                pushbutton.setMaximumWidth(w)
        self.putSymbolValue(record, pushbutton)
        self.setGraphicElement(record, pushbutton)
        return self.nextPC()
    
    def r_createCheckBox(self, command, record):
        checkbox = ECCheckBoxWidget(self.textify(command['text']))
        checkbox.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Preferred)
        self.setGraphicElement(record, checkbox)
        return self.nextPC()
    
    def r_createLineEdit(self, command, record):
        lineinput = ECLineEditWidget()
        text = self.textify(command['text'])
        lineinput.setText(str(text))
        fm = lineinput.fontMetrics()
        m = lineinput.textMargins()
        c = lineinput.contentsMargins()
        w = fm.horizontalAdvance('x') * self.textify(command['size']) +m.left()+m.right()+c.left()+c.right()
        lineinput.setMaximumWidth(w)
        self.setGraphicElement(record, lineinput)
        return self.nextPC()
    
    def r_createMultiLineEdit(self, command, record):
        textinput = ECPlainTextEditWidget()
        if 'readonly' in command:
            textinput.setReadOnly(True)
        if 'cols' in command and 'rows' in command:
            fontMetrics = textinput.fontMetrics()
            charWidth = fontMetrics.horizontalAdvance('x')
            charHeight = fontMetrics.height()
            textinput.setFixedWidth(charWidth * self.textify(command['cols']))
            textinput.setFixedHeight(charHeight * self.textify(command['rows']))
        else:
            textinput.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, textinput)
        return self.nextPC()
    
    def r_createMDPanel(self, command, record):
        preview = ECMDPanelWidget()
        if 'cols' in command and 'rows' in command:
            fontMetrics = preview.fontMetrics()
            charWidth = fontMetrics.horizontalAdvance('x')
            charHeight = fontMetrics.height()
            preview.setFixedWidth(charWidth * self.textify(command['cols']))
            preview.setFixedHeight(charHeight * self.textify(command['rows']))
        else:
            preview.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, preview)
        return self.nextPC()
    
    def r_createListWidget(self, command, record):
        listwidget = ECListBoxWidget()
        self.setGraphicElement(record, listwidget)
        return self.nextPC()
    
    def r_createComboBox(self, command, record):
        combobox = ECComboBoxWidget()
        self.setGraphicElement(record, combobox)
        return self.nextPC()
    
    def r_createPanel(self, command, record):
        self.setGraphicElement(record, QWidget())
        return self.nextPC()

    def r_createShape(self, command, record):
        kwargs = {}
        if 'type' in command: kwargs['kind'] = self.textify(command['type'])
        if 'radius' in command: kwargs['radius'] = self.textify(command['radius'])
        if 'fill' in command and command['fill'] is not None:
            kwargs['fill'] = self.textify(command['fill'])
        if 'border' in command and command['border'] is not None:
            kwargs['border'] = self.textify(command['border'])
        if 'borderwidth' in command: kwargs['borderwidth'] = self.textify(command['borderwidth'])
        widget = ECShapeWidget(**kwargs)
        self.setGraphicElement(record, widget)
        return self.nextPC()

    def r_createTable(self, command, record):
        table = ECTableWidget()
        if 'columns' in command:
            table.setColumnCount(int(self.textify(command['columns'])))
        if 'rows' in command:
            table.setRowCount(int(self.textify(command['rows'])))
        table.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, table)
        return self.nextPC()

    def r_createLog(self, command, record):
        log = ECLogWidget()
        if 'cols' in command and 'rows' in command:
            fontMetrics = log.fontMetrics()
            log.setFixedWidth(fontMetrics.horizontalAdvance('x') * self.textify(command['cols']))
            log.setFixedHeight(fontMetrics.height() * self.textify(command['rows']))
        else:
            log.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, log)
        return self.nextPC()

    def r_createPanes(self, command, record):
        orientation = self.textify(command.get('orientation')) or 'horizontal'
        if orientation == 'vertical':
            splitter = QSplitter(Qt.Orientation.Vertical)
        else:
            splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setChildrenCollapsible(False)
        self.setGraphicElement(record, splitter)
        return self.nextPC()

    def r_createTabs(self, command, record):
        tabs = QTabWidget()
        if 'cols' in command and 'rows' in command:
            fontMetrics = tabs.fontMetrics()
            tabs.setFixedWidth(fontMetrics.horizontalAdvance('x') * self.textify(command['cols']))
            tabs.setFixedHeight(fontMetrics.height() * self.textify(command['rows']))
        else:
            tabs.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, tabs)
        return self.nextPC()
    
    def r_createDialog(self, command, record):

        # This is probably not needed anymore
        class ECDialogX(QDialog):
            def __init__(self, parent, record):
                super().__init__(parent)
                self.record = record
            
            def showEvent(self, event):
                super().showEvent(event)
                QTimer.singleShot(100, self.afterShown)
            
            def afterShown(self):
                if 'action' in self.record: self.record['action']()

        win = command['window']
        if win != None:
            win = self.getInnerObject(self.getVariable(win))
        dialog = ECDialogWindow(win)
        dialogType = command['type'].lower()
        dialog.dialogType = dialogType  # type: ignore
        mainLayout = QVBoxLayout(dialog)
        if dialogType == 'generic':
            dialog.setFixedWidth(500)
            dialog.setFixedHeight(500)
            dialog.setWindowFlags(Qt.WindowType.FramelessWindowHint)
            dialog.setModal(True)
            dialog.setStyleSheet('background-color: white;border:1px solid black;')

            border = Border()
            border.tickClicked.connect(dialog.accept)
            border.closeClicked.connect(dialog.reject)
            mainLayout.addWidget(border)
            if 'layout' in command:
                layout = self.getInnerObject(self.getVariable(command['layout']))
                mainLayout.addLayout(layout)
            dialog.setLayout(mainLayout)
        elif dialogType in ('file', 'save'):
            # A native file chooser has no widgets of its own: `show` opens a
            # QFileDialog (open or save) and stores the chosen path as the
            # dialog's result. The parent window is kept so the chooser opens
            # over it; `filter`, when given, is a Qt filter string.
            dialog.window = win
            dialog.filter = (self.textify(command['filter']) if 'filter' in command else '') or ''
            title = self.textify(command['title'])
            if not title: title = 'Save a file' if dialogType == 'save' else 'Open a file'
            dialog.setWindowTitle(title)
        else:
            dialog.setWindowTitle(self.textify(command['title']))
            prompt = self.textify(command['prompt'])
            dialog.value = self.textify(command.get('value'))  # type: ignore
            if dialogType == 'confirm':
                mainLayout.addWidget(ECLabelWidget(prompt))
            elif dialogType == 'lineedit':
                mainLayout.addWidget(ECLabelWidget(prompt))
                dialog.lineEdit = ECLineEditWidget()  # type: ignore
                dialog.lineEdit.setText(dialog.value or '')  # type: ignore
                mainLayout.addWidget(dialog.lineEdit)  # type: ignore
            elif dialogType == 'multiline':
                mainLayout.addWidget(ECLabelWidget(prompt))
                dialog.textEdit = ECPlainTextEditWidget()  # type: ignore
                dialog.textEdit.setPlainText(dialog.value or '')  # type: ignore
                mainLayout.addWidget(dialog.textEdit)  # type: ignore
            buttonBox = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
            buttonBox.accepted.connect(dialog.accept)
            buttonBox.rejected.connect(dialog.reject)
            mainLayout.addWidget(buttonBox, alignment=Qt.AlignmentFlag.AlignHCenter)
            
        self.setGraphicElement(record, dialog)
        return self.nextPC()
    
    # Creates a message box but doesn't run it
    def r_createMessageBox(self, command, record):
        record['window'] = command['window']
        record['style'] = command['style']
        record['title'] = self.textify(command['title'])
        record['message'] = self.textify(command['message'])
        return self.nextPC()

    def r_create(self, command):
        record = self.getVariable(command['name'])
        keyword = record['keyword']
        if keyword == 'window': return self.r_createWindow(command, record)
        elif keyword == 'layout': return self.r_createLayout(command, record)
        elif keyword == 'group': return self.r_createGroupBox(command, record)
        elif keyword == 'label': return self.r_createLabel(command, record)
        elif keyword == 'pushbutton': return self.r_createPushbutton(command, record)
        elif keyword == 'checkbox': return self.r_createCheckBox(command, record)
        elif keyword == 'lineinput': return self.r_createLineEdit(command, record)
        elif keyword == 'multiline': return self.r_createMultiLineEdit(command, record)
        elif keyword == 'mdpanel': return self.r_createMDPanel(command, record)
        elif keyword == 'listbox': return self.r_createListWidget(command, record)
        elif keyword == 'combobox': return self.r_createComboBox(command, record)
        elif keyword == 'panel': return self.r_createPanel(command, record)
        elif keyword == 'shape': return self.r_createShape(command, record)
        elif keyword == 'table': return self.r_createTable(command, record)
        elif keyword == 'logpane': return self.r_createLog(command, record)
        elif keyword == 'panes': return self.r_createPanes(command, record)
        elif keyword == 'tabs': return self.r_createTabs(command, record)
        elif keyword == 'dialog': return self.r_createDialog(command, record)
        elif keyword == 'messagebox': return self.r_createMessageBox(command, record)
        return None

    # Declare a dialog variable
    def k_dialog(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECDialog')

    def r_dialog(self, command):
        return self.nextPC()

    # Disable a widget
    def k_disable(self, command):
        if self.nextIsSymbol():
            command['name'] = self.getSymbolRecord()['name']
            self.add(command)
            return True
        return False
    
    def r_disable(self, command):
        self.getInnerObject(self.getVariable(command['name'])).setEnabled(False)  # type: ignore
        return self.nextPC()

    # Enable a widget
    def k_enable(self, command):
        if self.nextIsSymbol():
            command['name'] = self.getSymbolRecord()['name']
            self.add(command)
            return True
        return False
    
    def r_enable(self, command):
        self.getInnerObject(self.getVariable(command['name'])).setEnabled(True)  # type: ignore
        return self.nextPC()

    # Create a group box
    def k_group(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECGroup')

    def r_group(self, command):
        return self.nextPC()

    # hide {widget}
    def k_hide(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECCoreWidget):
                command['domain'] = record['domain']
                command['widget'] = record['name']
                self.add(command)
                return True
        return False
        
    def r_hide(self, command):
        record = self.getVariable(command['widget'])
        self.getInnerObject(record).hide()  # type: ignore
        return self.nextPC()

    # Initialize the graphics environment
    def k_init(self, command):
        if self.nextIsWord('graphics'):
            self.add(command)
            return True
        return False
    
    def r_init(self, command):
        print('Initializing graphics...')
        # Check if QApplication already exists (created by debugger)
        from PySide6.QtWidgets import QApplication
        self.app = QApplication.instance()
        if self.app is None:
            self.app = QApplication(sys.argv)
        screen = QApplication.screens()[0].size().toTuple()
        self.program.screenWidth = screen[0]  # type: ignore
        self.program.screenHeight = screen[1]  # type: ignore
        print(f'Screen: {self.program.screenWidth}x{self.program.screenHeight}')
        
        def on_last_window_closed():
            self.program.kill()
        def init():
            try:
                self.program.flush(self.nextPC())
            except Exception as e:
                pass
        def flush():
            if self.flushRunning:
                self.flushSkipCount += 1
                if self.flushSkipCount % 100 == 0:
                    print(f'Graphics flush skipped {self.flushSkipCount} times (flush still running)')
                return
            self.flushRunning = True
            try:
                if not self.blocked:
                    if self.runOnTick != 0:
                        if not self.program.running:
                            print('Call on tick handler...')
                            self.program.run(self.runOnTick)
                        else:
                            self.tickBusySkipCount += 1
                            if self.tickBusySkipCount % 100 == 0:
                                print(f'Graphics tick skipped {self.tickBusySkipCount} times (program busy)')
                # The intent queue must keep draining while blocked, or queued
                # event handlers (e.g. a Resume button) could never run to
                # clear the block. `blocked` pauses the automatic tick only.
                self.program.flushCB()
            finally:
                self.flushRunning = False
        timer = QTimer()
        timer.timeout.connect(flush)
        # Adjust this for optimal performace.
        # Too small and it may hang; too large and it may feel unresponsive
        # The value needed will also depend on CPU performace
        timer.start(250) # 0.25 sec interval
        QTimer.singleShot(500, init)
        self.program.startGraphics()
        
        # If debugger already exists (debugging mode), don't create another one
        # and don't call exec() as the debugger's event loop is already running
        if self.program.debugging and self.program.debugger is None:
            print('Starting debugger...')
            self.program.debugger = Debugger(self.program)
            self.program.debugger.enableBreakpoints()
        
        self.app.lastWindowClosed.connect(on_last_window_closed)  # type: ignore
        
        # Only call exec() if debugger is not running (i.e., not in debug mode)
        # When debugger exists, it manages the event loop
        if self.program.debugger is None:
            self.app.exec()
        else:
            # In debug mode, return control to debugger
            return self.nextPC()

    # Declare a label variable
    def k_label(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLabel')
    def r_label(self, command):
        return self.nextPC()

    # Declare a layout variable
    def k_layout(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLayout')

    def r_layout(self, command):
        return self.nextPC()

    # Declare a line input variable
    def k_lineinput(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLineInput')

    def r_lineinput(self, command):
        return self.nextPC()

    # Declare a listbox input variable
    def k_listbox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECListBox')

    def r_listbox(self, command):
        return self.nextPC()

    # Declare a messagebox variable
    def k_messagebox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMessageBox')

    def r_messagebox(self, command):
        return self.nextPC()

    # Declare a multiline input variable
    def k_multiline(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMultiline')
    def r_multiline(self, command):
        return self.nextPC()

    # markdown preview {variable}
    def k_mdpanel(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMDPanel')

    def r_mdpanel(self, command):
        return self.nextPC()

    # on click/tap {pushbutton}/{lineinput}/{multiline}/{table}
    # on select {combobox}/{listbox}/{table}
    # on tick
    # on close {window}
    #
    # Each may take `go to {label}` instead of an indented body. A named handler is
    # resolved when the event fires, so it may sit below the registration; it ends with
    # `return`, and the return address pushed for it is the end of the program.
    def namedHandler(self):
        if language.reverse_word(self.peek() or '') not in ('go', 'gosub'):
            return None
        self.nextToken()
        self.skipWord('to')
        return self.nextToken()

    def k_on(self, command):
        def setupOn():
            command['goto'] = self.getCodeSize() + 2
            self.add(command)
            self.nextToken()
            # Step over the click handler
            pcNext = self.getCodeSize()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # This is the click handler
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the goto
            self.getCommandAt(pcNext)['goto'] = self.getCodeSize()

        token = self.nextToken()
        command['type'] = token
        if token in ['click', 'tap']:
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if isinstance(self.getObject(record), ECWidget):
                    command['domain'] = record['domain']
                    command['name'] = record['name']
                    label = self.namedHandler()
                    if label is not None:
                        command['label'] = label
                        self.add(command)
                        return True
                    setupOn()
                    return True
        elif token == 'select':
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if isinstance(self.getObject(record), ECCoreWidget):
                    command['name'] = record['name']
                    label = self.namedHandler()
                    if label is not None:
                        command['label'] = label
                        self.add(command)
                        return True
                    setupOn()
                    return True
        elif token == 'close':
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWindow):
                    command['domain'] = record['domain']
                    command['name'] = record['name']
                    label = self.namedHandler()
                    if label is not None:
                        command['label'] = label
                        self.add(command)
                        return True
                    setupOn()
                    return True
        elif token == 'tick':
            command['tick'] = True
            command['runOnTick'] = self.getCodeSize() + 2
            self.add(command)
            self.nextToken()
            # Step over the on tick action
            pcNext = self.getCodeSize()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # This is the on tick handler
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the goto
            self.getCommandAt(pcNext)['goto'] = self.getCodeSize()
            return True
        return False
    
    # Run a handler label named by an `on ... go to {label}`. The label is resolved when
    # the event fires so it may be written below the registration; the return address it
    # pops is the end of the program, because an event handler has nothing to go back to.
    def runNamedLabel(self, label):
        pc = self.symbols.get(label + ':')
        if pc is None:
            print(f'There is no label "{label}:"')
            return
        self.stack.append(0)
        self.run(pc)

    def r_on(self, command):
        if command['type'] == 'tick':
            self.runOnTick = command['runOnTick']
        elif command['type'] == 'close':
            record = self.getVariable(command['name'])
            window = self.getInnerObject(record)
            goto = command.get('goto')
            label = command.get('label')
            # The handler runs here and now, inside the window's close event:
            # `run` queues it and the program's own `flushCB` drains the queue,
            # so it completes before Qt finishes closing the window — and, when
            # this is the last window, before the runtime kills the program.
            # flushCB (rather than the module-level `flush` imported above) so
            # the queue drained is the running program's: `python3 -m
            # allspeak.as_program` loads this file twice, and only the copy that
            # built the Program has a queue.
            def onClose():
                if label is not None:
                    self.runNamedLabel(label)
                else:
                    self.run(goto)
                self.program.flushCB()
            window.setOnClose(onClose)
        else:
            record = self.getVariable(command['name'])
            object = self.getObject(record)
            goto = command.get('goto')
            
            # Connect the current element to a handler
            current_index = object.getIndex()
            widget = self.getInnerObject(object)
            
            # Create a closure to capture the current index
            def make_handler(index):
                def handler():
                    print(f'Event triggered for {record["name"]}, index: {index}')
                    object.setIndex(index)
                    self.run(goto)
                    flush()
                return handler
            
            if 'label' in command:
                label = command['label']
                def handler():
                    self.runNamedLabel(label)
                    flush()
            else:
                handler = make_handler(current_index)

            # Connect based on widget type
            if self.isObjectType(record, ECTable):
                if command['type'] in ('click', 'tap'):
                    def onCellClicked(row, column, widget=widget, handler=handler):
                        widget.clickedRow = row
                        widget.clickedColumn = column
                        handler()
                    widget.cellClicked.connect(onCellClicked)
                else:
                    widget.itemSelectionChanged.connect(handler)
            elif self.isObjectType(record, ECTabs):
                widget.currentChanged.connect(handler)
            elif self.isObjectType(record, ECPushButton):
                widget.clicked.connect(handler)
            elif self.isObjectType(record, ECComboBox):
                widget.currentIndexChanged.connect(handler)
            elif self.isObjectType(record, ECListBox):
                widget.itemClicked.connect(handler)
        return self.nextPC()

    # Declare a simple panel variable
    def k_panel(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECPanel')

    def r_panel(self, command):
        return self.nextPC()

    # Declare a shape variable (rect, roundrect, ellipse or circle)
    def k_shape(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECShape')

    def r_shape(self, command):
        return self.nextPC()

    # Declare a table variable
    def k_table(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECTable')

    def r_table(self, command):
        return self.nextPC()

    # Declare a log pane variable. The type is `logpane` because `log` is already the
    # core print command, and a declaration that printed its own name would be the
    # wrong reading of `log Journal`.
    def k_logpane(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLog')

    def r_logpane(self, command):
        return self.nextPC()

    # Declare a panes variable (a splitter)
    def k_panes(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECPanes')

    def r_panes(self, command):
        return self.nextPC()

    # Declare a tabs variable
    def k_tabs(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECTabs')

    def r_tabs(self, command):
        return self.nextPC()

    # Declare a pushbutton variable
    def k_pushbutton(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECPushButton')

    def r_pushbutton(self, command):
        return self.nextPC()

    # remove [the] [current/selected] [item] [from/in] {combobox}/{listbox}
    # Graphics-reserved syntax: optional article pattern is plugin-safe (core-only command)
    def k_remove(self, command):
        command['variant'] = None
        self.skipArticles()  # Optional 'the', 'a', 'an' — syntactic sugar
        self.skip(['current', 'selected'])
        self.skipWord('item')
        self.skip(['from', 'in'])
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECComboBox):
                command['variant'] = 'current'
                command['name'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECListBox):
                command['variant'] = 'current'
                command['name'] = record['name']
                self.add(command)
                return True
        return False
        
    def r_remove(self, command):
        variant = command['variant']
        record = self.getVariable(command['name'])
        if variant == 'current':
            if self.isObjectType(record, ECComboBox):
                widget = self.getInnerObject(record)
                widget.removeItem(widget.currentIndex())  # type: ignore
            if self.isObjectType(record, ECListBox):
                widget = self.getInnerObject(record)
                selectedItem = widget.currentItem()  # type: ignore
                if selectedItem:
                    row = widget.row(selectedItem)  # type: ignore
                    widget.takeItem(row)  # type: ignore
        return self.nextPC()

    # select index {n} [of] {combobox]}
    # select {name} [in] {combobox}
    def k_select(self, command):
        if self.nextIsWord('index'):
            command['index'] = self.nextValue()
            self.skipWord('of')
        else:
            command['name'] = self.getValue()
            self.skipWord('in')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECComboBox):
                command['widget'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_select(self, command):
        widget = self.getInnerObject(self.getVariable(command['widget']))
        if 'index' in command:
            index = self.textify(command['index'])
        else:
            name = self.textify(command['name'])
            index = widget.findText(name, Qt.MatchFlag.MatchFixedString)  # type: ignore
        if index >= 0:
            widget.setCurrentIndex(index)  # type: ignore
        return self.nextPC()

    # set [the] width/height [of] {widget} [to] {value}
    # set [the] layout of {window}/{widget} to {layout}
    # set [the] spacing of {layout} to {value}
    # set [the] title of {window}/{group}/{dialog} to {title}
    # set [the] text [of] {label}/{button}/{lineinput}/{multiline} [to] {text}
    # set [the] color [of] {label}/{button}/{lineinput}/{multiline} [to] {color}
    # set [the] state [of] {checkbox} [to] {state}
    # set [the] style of {widget} to {style}
    # set [the] cursor of {widget} to arrow|hand|wait|progress|text|move|crosshair|help|not-allowed|grab|grabbing|none
    # set {listbox} to {list}
    # set blocked true/false
    def k_set(self, command):
        self.skipArticles()  # Optional 'the', 'a', 'an' — syntactic sugar for readability
        token = self.nextToken()
        command['what'] = token
        # The canonical spelling of the attribute. The branches above this one compare
        # the English word (as they always have); the table forms below compare the
        # canonical, so a pack that names `cellule` still reaches the cell branch.
        canon = language.reverse_word(token)
        if token in ['width', 'height']:
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECCoreWidget):
                    command['domain'] = record['domain']
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'size':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWindow):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['width'] = self.nextValue()
                    command['height'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'layout':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECWindow, ECGroup, ECPanel)):
                    command['name'] = record['name']
                    self.skipWord('to')
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECLayout):
                            command['layout'] = record['name']
                            self.add(command)
                            return True
        elif token == 'spacing':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLayout):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'title':
            # The counterpart of `create {window}/{group}/{dialog} title …`:
            # a window's/dialog's window title, or a group box's caption.
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECWindow, ECGroup, ECDialog)):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'text':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECLabel, ECPushButton, ECLineInput, ECMultiline, ECMDPanel, ECLog)):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'state':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECCheckBox):
                    command['name'] = record['name']
                    self.skipWord('to')
                    if language.reverse_word(self.peek()) == 'checked':
                        command['value'] = self.compileConstant(True)
                        self.nextToken()
                    elif language.reverse_word(self.peek()) == 'unchecked':
                        command['value'] = self.compileConstant(False)
                        self.nextToken()
                    else: command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'style':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWidget):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'cursor':
            # set [the] cursor of {widget} to wait|arrow|hand|…
            # The name is a bare word (the form people write), a backticked string or a variable,
            # and the table is shared with the browser runtime so a script's words do not change
            # between the two flavours.
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECWidget, ECWindow, ECDialog)):
                    command['what'] = 'cursor'
                    command['name'] = record['name']
                    self.skipWord('to')
                    ahead = self.peek()
                    if ahead and (ahead[0] == '`' or ahead in self.symbols):
                        command['value'] = self.nextValue()
                    else:
                        command['value'] = self.compileConstant(self.nextToken())
                    self.add(command)
                    return True
        elif token == 'alignment':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWidget):
                    command['name'] = record['name']
                    self.skipWord('to')
                    flags = []
                    while self.peek() in ['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom', 'center']:
                        flags.append(self.nextToken())
                    command['value'] = flags
                    self.add(command)
                    return True
        elif token == 'style':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLabel):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'color':
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLabel):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'background':
            self.skipWord('color')
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECLabel, ECPushButton, ECLineInput, ECMultiline)):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'blocked':
            command['what'] = 'blocked'
            command['blocked'] = True if self.nextToken() == 'true' else False
            self.add(command)
            return True
        elif token in ['radius', 'fill', 'border', 'borderwidth']:
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECShape):
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'columns':
            # set columns of {table} to {array-of-labels}
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['what'] = 'columns'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'rows':
            # set rows of {table} to {array-of-arrays}
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['what'] = 'rows'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'row' and language.reverse_word(self.peek() or '') == 'numbers':
            # set row numbers of {table} to true/false — the vertical header
            self.nextToken()
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['what'] = 'rownumbers'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'column' and language.reverse_word(self.peek() or '') == 'widths':
            # set column widths of {table} to {array-of-widths}
            self.nextToken()
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['what'] = 'columnwidths'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'stretch' and language.reverse_word(self.peek() or '') == 'column':
            # set stretch column of {table} to {index}
            self.nextToken()
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTable):
                    command['what'] = 'stretchcolumn'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'selection':
            # set selection of {table}/{listbox} to single|contiguous|multiple|none
            # `multiple` is Qt's ExtendedSelection, so Ctrl and Shift both work.
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECTable, ECListBox)):
                    command['what'] = 'selection'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = language.reverse_word(self.nextToken())
                    self.add(command)
                    return True
        elif canon == 'sizes':
            # set sizes of {panes} to {array-of-widths}
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECPanes):
                    command['what'] = 'panesizes'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'current' and language.reverse_word(self.peek() or '') == 'tab':
            # set current tab of {tabs} to {index}
            self.nextToken()
            self.skipWord('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECTabs):
                    command['what'] = 'tabindex'
                    command['name'] = record['name']
                    self.skipWord('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif canon == 'cell':
            # set cell {table} {row} {column} to {text}
            # set cell colour {table} {row} {column} to {foreground} [background]
            # set cell tooltip {table} {row} {column} to {text}
            # set cell alignment {table} {row} {column} to left|center|right
            form = language.reverse_word(self.peek() or '')
            if form in ('colour', 'color', 'tooltip', 'alignment'):
                self.nextToken()
            else:
                form = 'text'
            if not self.nextIsSymbol():
                return False
            record = self.getSymbolRecord()
            if not self.isObjectType(record, ECTable):
                return False
            command['what'] = 'cell' + ('' if form == 'text' else form)
            command['name'] = record['name']
            self.nextToken()                    # onto the row
            command['row'] = self.getValue()
            self.nextToken()                    # onto the column
            command['column'] = self.getValue()
            self.skipWord('to')
            if form == 'alignment':
                # An alignment is a word, not a value: read it raw, and canonical.
                command['value'] = language.reverse_word(self.nextToken())
            else:
                command['value'] = self.nextValue()
                # A colour pair is `foreground` then, on the same line, `background`.
                # The line test is what stops a one-colour form from taking the next
                # statement's first token as its background.
                if form in ('colour', 'color') and self.peek() is not None \
                        and self.peekLino() == self.compiler.getLino():
                    command['background'] = self.nextValue()
            self.add(command)
            return True
        elif self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECListBox):
                command['what'] = 'listbox'
                command['name'] = record['name']
                self.skipWord('to')
                command['value'] = self.nextValue()
                self.add(command)
                return True
        return False
    
    def r_set(self, command):
        what = command['what']
        if what == 'blocked':
            self.blocked = command['blocked']
        elif what == 'height':
            widget = self.getInnerObject(self.getVariable(command['name']))
            widget.setFixedHeight(self.textify(command['value']))  # type: ignore
        elif what == 'width':
            widget = self.getInnerObject(self.getVariable(command['name']))
            widget.setFixedWidth(self.textify(command['value']))  # type: ignore
        elif what == 'size':
            window = self.getInnerObject(self.getVariable(command['name']))
            window.resize(self.textify(command['width']), self.textify(command['height']))  # type: ignore
        elif what == 'layout':
            target = self.getVariable(command['name'])
            object = target['object']
            layoutObject = self.getVariable(command['layout'])['object']
            self.checkObjectType(layoutObject, ECLayout)
            layout = self.getInnerObject(layoutObject)
            if isinstance(object, ECWindow):
                window = self.getInnerObject(object)
                container = QWidget()
                container.setLayout(layout) # type: ignore
                self.getInnerObject(object).setCentralWidget(container) # type: ignore
            elif isinstance(object, (ECLayout, ECGroup, ECPanel)):
                self.getInnerObject(object).setLayout(layout)  # type: ignore
        elif what == 'spacing':
            layout = self.getInnerObject(self.getVariable(command['name']))
            layout.setSpacing(self.textify(command['value']))  # type: ignore
        elif what == 'text':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            text = self.textify(command['value'])
            if self.isObjectType(record, (ECLabel, ECPushButton)):
                widget.setText(str(text))  # type: ignore
            elif self.isObjectType(record, ECMultiline):
                widget.setPlainText(str(text))  # type: ignore
            elif self.isObjectType(record, ECLog):
                widget.setPlainText(str(text))  # type: ignore
            elif self.isObjectType(record, ECMDPanel):
                widget.setMarkdown(str(text))  # type: ignore
            if self.isObjectType(record, ECPushButton):
                widget.setAccessibleName(str(text))  # type: ignore
        elif what == 'title':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            title = str(self.textify(command['value']))
            if self.isObjectType(record, ECGroup):
                widget.setTitle(title)  # type: ignore
            else:
                widget.setWindowTitle(title)  # type: ignore
        elif what == 'state':
            record = self.getVariable(command['name'])
            if self.isObjectType(record, ECCheckBox):
                state = self.textify(command['value'])
                state = False if state == None else True
                self.getInnerObject(record).setChecked(state)  # type: ignore
        elif what == 'alignment':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            flags = command['value']
            alignment = 0
            for flag in flags:
                if flag == 'left': alignment |= Qt.AlignmentFlag.AlignLeft
                elif flag == 'hcenter': alignment |= Qt.AlignmentFlag.AlignHCenter
                elif flag == 'right': alignment |= Qt.AlignmentFlag.AlignRight
                elif flag == 'top': alignment |= Qt.AlignmentFlag.AlignTop
                elif flag == 'vcenter': alignment |= Qt.AlignmentFlag.AlignVCenter
                elif flag == 'bottom': alignment |= Qt.AlignmentFlag.AlignBottom
                elif flag == 'center': alignment |= Qt.AlignmentFlag.AlignCenter
            widget.setAlignment(alignment)
        elif what == 'cursor':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            name = str(self.textify(command['value'])).strip().lower()
            if name not in CURSORS:
                raise RuntimeError(self.program,
                    f"'{name}' is not a cursor. Try arrow, hand, wait, progress, text, move, "
                    f"crosshair, help, grab, grabbing, not-allowed or none.")
            widget.setCursor(CURSORS[name])  # type: ignore
        elif what == 'style':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            styles = self.textify(command['value'])
            widget.setStyleSheet(styles)  # type: ignore
        elif what == 'color':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            color = self.textify(command['value'])
            widget.setStyleSheet(f"color: {color};")  # type: ignore
        elif what == 'background-color':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            bg_color = self.textify(command['value'])
            widget.setStyleSheet(f"background-color: {bg_color};")  # type: ignore
        elif what in ('radius', 'fill', 'border', 'borderwidth'):
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            if what == 'radius': widget.setRadius(self.textify(command['value']))  # type: ignore
            elif what == 'fill': widget.setFill(self.textify(command['value']))  # type: ignore
            elif what == 'border': widget.setBorder(self.textify(command['value']))  # type: ignore
            elif what == 'borderwidth': widget.setBorderWidth(self.textify(command['value']))  # type: ignore
        elif what == 'listbox':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            value = self.evaluate(command['value'])
            widget.clear()  # type: ignore
            for item in self.listItems(value):
                widget.addItem(item)  # type: ignore
        elif what == 'columns':
            widget = self.getInnerObject(self.getVariable(command['name']))
            columns = [str(self.textify(c)) for c in self.tableValueList(command['value'])]
            widget.setColumnCount(len(columns))  # type: ignore
            widget.setHorizontalHeaderLabels(columns)  # type: ignore
        elif what == 'rows':
            widget = self.getInnerObject(self.getVariable(command['name']))
            self.setTableRows(widget, command['value'])
        elif what == 'columnwidths':
            widget = self.getInnerObject(self.getVariable(command['name']))
            for index, width in enumerate(self.tableValueList(command['value'])):
                widget.setColumnWidth(index, int(self.textify(width)))  # type: ignore
        elif what == 'stretchcolumn':
            widget = self.getInnerObject(self.getVariable(command['name']))
            index = int(self.textify(command['value']))
            if 0 <= index < widget.columnCount():  # type: ignore
                widget.horizontalHeader().setSectionResizeMode(  # type: ignore
                    index, QHeaderView.ResizeMode.Stretch)
        elif what == 'rownumbers':
            widget = self.getInnerObject(self.getVariable(command['name']))
            widget.verticalHeader().setVisible(bool(self.textify(command['value'])))  # type: ignore
        elif what == 'selection':
            # The mode is a word, not a value, so a typo is a runtime error rather than a
            # silently unchanged widget.
            widget = self.getInnerObject(self.getVariable(command['name']))
            mode = {
                'single': QAbstractItemView.SelectionMode.SingleSelection,
                'contiguous': QAbstractItemView.SelectionMode.ContiguousSelection,
                'multiple': QAbstractItemView.SelectionMode.ExtendedSelection,
                'none': QAbstractItemView.SelectionMode.NoSelection,
            }.get(str(command['value']))
            if mode is None:
                raise RuntimeError(
                    self.program,
                    f"Unknown selection mode `{command['value']}`: single, contiguous, multiple or none")
            widget.setSelectionMode(mode)  # type: ignore
        elif what == 'panesizes':
            widget = self.getInnerObject(self.getVariable(command['name']))
            sizes = [int(self.textify(size)) for size in self.tableValueList(command['value'])]
            widget.setSizes(sizes)  # type: ignore
        elif what == 'tabindex':
            widget = self.getInnerObject(self.getVariable(command['name']))
            index = int(self.textify(command['value']))
            if 0 <= index < widget.count():  # type: ignore
                widget.setCurrentIndex(index)  # type: ignore
        elif what in ('cell', 'cellcolour', 'cellcolor', 'celltooltip', 'cellalignment'):
            widget = self.getInnerObject(self.getVariable(command['name']))
            row = int(self.textify(command['row']))
            column = int(self.textify(command['column']))
            if 0 <= row < widget.rowCount() and 0 <= column < widget.columnCount():  # type: ignore
                item = self.tableItem(widget, row, column)
                text = self.textify(command['value'])
                if what == 'cell':
                    item.setText('' if text is None else str(text))
                elif what in ('cellcolour', 'cellcolor'):
                    if text:
                        item.setForeground(QBrush(QColor(str(text))))
                    if 'background' in command:
                        background = self.textify(command['background'])
                        if background:
                            item.setBackground(QBrush(QColor(str(background))))
                elif what == 'celltooltip':
                    item.setToolTip('' if text is None else str(text))
                elif what == 'cellalignment':
                    alignment = {
                        'left': Qt.AlignmentFlag.AlignLeft,
                        'center': Qt.AlignmentFlag.AlignHCenter,
                        'centre': Qt.AlignmentFlag.AlignHCenter,
                        'right': Qt.AlignmentFlag.AlignRight,
                        'justify': Qt.AlignmentFlag.AlignJustify,
                    }.get(str(text), Qt.AlignmentFlag.AlignLeft)
                    item.setTextAlignment(alignment | Qt.AlignmentFlag.AlignVCenter)
        return self.nextPC()

    # The value as a Python list, keeping nested rows. A list variable holds its content
    # as JSON text; a literal is a JSON string; a scratch value is a single item.
    def tableValueList(self, value):
        value = self.evaluate(value)
        if isinstance(value, ECValue):
            content = value.getContent()
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except Exception:
                    pass
            if isinstance(content, list):
                return content
            return [content]
        if isinstance(value, list):
            return value
        return [value]

    # The item at a cell, created (empty) if the script is colouring or annotating a
    # cell whose text has not been set yet.
    def tableItem(self, widget, row, column):
        item = widget.item(row, column)
        if item is None:
            item = QTableWidgetItem('')
            widget.setItem(row, column, item)
        return item

    # Fill a table from an array of rows. A row is an array of cell texts, or an object
    # whose keys are the column labels; a shorter row leaves the rest of the line empty.
    def setTableRows(self, widget, value):
        rows = self.tableValueList(value)
        headers = []
        for column in range(widget.columnCount()):
            item = widget.horizontalHeaderItem(column)
            headers.append(item.text() if item else '')
        widget.setRowCount(len(rows))
        for rowIndex, row in enumerate(rows):
            if isinstance(row, dict):
                cells = [row.get(header, '') for header in headers]
            elif isinstance(row, (list, tuple)):
                cells = list(row)
            else:
                cells = [row]
            for column, cell in enumerate(cells):
                if column >= widget.columnCount():
                    break
                text = self.textify(cell) if isinstance(cell, ECValue) else cell
                self.tableItem(widget, rowIndex, column).setText('' if text is None else str(text))

    # show {window}
    # show {dialog}
    # show {widget}
    # show {messagebox} giving {result}}
    def k_show(self, command):
        if language.reverse_word(self.peek()) == 'keyboard':
            self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECLineInput, ECMultiline)):
                    command['keyboard'] = True
                    command['field'] = record['name']
                    if language.reverse_word(self.peek()) == 'on':
                        self.nextToken()
                        if self.nextIsSymbol():
                            windowRecord = self.getSymbolRecord()
                            if self.isObjectType(windowRecord, ECWindow):
                                command['window'] = windowRecord['name']
                    self.skipWord('giving')
                    if self.nextIsSymbol():
                        command['result'] = self.getSymbolRecord()['name']
                    self.add(command)
                    return True
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECCoreWidget):
                command['domain'] = record['domain']
                command['name'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECWindow):
                command['window'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECDialog):
                command['dialog'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECMessageBox):
                command['messagebox'] = record['name']
                self.skipWord('giving')
                if self.nextIsSymbol():
                    command['result'] = self.getSymbolRecord()['name']
                    self.add(command)
                    return True
        return False
        
    def r_show(self, command):
        if 'keyboard' in command:
            record = self.getVariable(command['field'])
            widget = self.getInnerObject(record)
            caller = None
            if 'window' in command:
                windowRecord = self.getVariable(command['window'])
                caller = self.getInnerObject(windowRecord)
            receiver = TextReceiver(widget)
            Keyboard(self.program, receiver, caller)
            if 'result' in command:
                target = self.getVariable(command['result'])
                v = ECValue(domain='graphics', type=str, content=receiver.getContent())
                self.putSymbolValue(target, v)
            return self.nextPC()
        if 'messagebox' in command:
            record = self.getVariable(command['messagebox'])
            windowRecord = self.getVariable(record['window'])
            window = self.getInnerObject(windowRecord)
            style = record['style']
            title = record['title']
            message = record['message']
            target = self.getVariable(command['result'])
            if style == 'question':
                choice = QMessageBox.question(window, title, message)
                result = 'Yes' if choice == QMessageBox.StandardButton.Yes else 'No'
            elif style == 'yesnocancel':
                choice = QMessageBox.question(
                    window, 
                    title, 
                    message,
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No | QMessageBox.StandardButton.Cancel
                )
                if choice == QMessageBox.StandardButton.Yes: 
                    result = 'Yes'
                elif choice == QMessageBox.StandardButton.No:
                    result = 'No'
                else:
                    result = 'Cancel'
            elif style == 'warning':
                choice = QMessageBox.warning(window, title, message)
                if choice == QMessageBox.StandardButton.Ok: result = 'OK'
                else: result = ''
            else: result = 'Cancel'
            v = ECValue(domain='graphics', type=str, content=result)
            self.putSymbolValue(target, v)
        elif 'window' in command:
            window = self.getInnerObject(self.getVariable(command['window'])['object'])
            window.show() # type: ignore
        elif 'dialog' in command:
            record = self.getVariable(command['dialog'])
            object = self.getObject(record)
            dialog = self.getInnerObject(record)
            if dialog.dialogType == 'generic':
                object.result =  dialog.exec()
            elif dialog.dialogType == 'confirm':
                object.result = True if dialog.exec() == QDialog.DialogCode.Accepted else False
            elif dialog.dialogType == 'lineedit':
                if dialog.exec() == QDialog.DialogCode.Accepted:
                    object.result = dialog.lineEdit.text()  # type: ignore
                else: object.result = dialog.value  # type: ignore
            elif dialog.dialogType == 'multiline':
                if dialog.exec() == QDialog.DialogCode.Accepted:
                    object.result = dialog.textEdit.toPlainText()  # type: ignore
                else: object.result = dialog.value  # type: ignore
            elif dialog.dialogType in ('file', 'save'):
                # Native chooser. The result is the chosen path, or an empty
                # string if the user cancelled, so a script tests it with
                # `if Path is empty`. `file` picks an existing file to read;
                # `save` picks a name to write (the file is not created here —
                # the script writes it). Both return a (path, filter) pair.
                parent = getattr(dialog, 'window', None)
                title = dialog.windowTitle() or ('Save a file' if dialog.dialogType == 'save' else 'Open a file')
                filterText = getattr(dialog, 'filter', '') or ''
                if dialog.dialogType == 'save':
                    path, _ = QFileDialog.getSaveFileName(parent, title, '', filterText)
                else:
                    path, _ = QFileDialog.getOpenFileName(parent, title, '', filterText)
                object.result = path
        elif 'name' in command:
            record = self.getVariable(command['name'])
            self.getInnerObject(record).show()  # type: ignore
        return self.nextPC()

    # Declare a window variable
    def k_window(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECWindow')

    def r_window(self, command):
        return self.nextPC()
    
    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = ECValue(domain=self.getName())
        token = self.getToken()
        if self.isSymbol():
            value.setName(token)
            record = self.getSymbolRecord()
            object = self.getObject(record)
            if isinstance(object, (ECCoreWidget, ECDialog)) and object.hasRuntimeValue():
                value.setType('object')
                return value
            else: return None
        else:
            if self.isWord('the'): token = self.nextToken()
            value.setType(token)
            if token in ['count', 'current', 'selected', 'clicked']:
                value.setType(token)
                if token == 'count':
                    self.skipWord('of')
                elif token in ['current', 'selected', 'clicked'] \
                        and language.reverse_word(self.peek() or '') == 'tab' and token == 'current':
                    # the current tab of {tabs}
                    self.nextToken()
                    self.skipWord('of')
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECTabs):
                            value.setType('currentTab')
                            value.target = record['name']
                            return value
                    return None
                elif token in ['current', 'selected', 'clicked'] \
                        and language.reverse_word(self.peek() or '') in ('row', 'column'):
                    # the selected row of {table} / the clicked column of {table}
                    self.nextToken()
                    which = language.reverse_word(self.getToken())
                    self.skipWord('of')
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECTable):
                            value.setType(token + which.capitalize())
                            value.target = record['name']
                            return value
                    return None
                elif token in ['current', 'selected']:
                    token = self.nextToken()
                    value.option = token
                    if token == 'item': self.skipWord('in')
                    elif token == 'index': self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECListBox) or self.isObjectType(record, ECComboBox): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token in ['row', 'column'] and language.reverse_word(self.peek() or '') == 'count':
                # the row count of {table} / the column count of {table}
                self.nextToken()
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECTable):
                        value.setType(token + 'Count')
                        value.target = record['name']
                        return value
            elif language.reverse_word(token) == 'selection':
                # the selection of {table}/{listbox} — every selected row index, as a list
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, (ECTable, ECListBox)):
                        value.setType('selection')
                        value.target = record['name']
                        return value
            elif token == 'cell':
                # the cell {row} {column} of {table}
                self.nextToken()
                value.row = self.getValue()
                self.nextToken()
                value.column = self.getValue()
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECTable):
                        value.setType('cell')
                        value.target = record['name']
                        return value
            elif token == 'count':
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECListBox) or self.isObjectType(record, ECComboBox): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token == 'text':
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if (
                        self.isObjectType(record, (ECLabel, ECPushButton, ECMultiline, ECLineInput, ECListBox, ECComboBox, ECLog))
                    ): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token == 'index':
                self.skipWord('of')
                value.element = self.getValue()
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, (ECListBox, ECComboBox)): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token in ['width', 'height', 'x', 'y']:
                self.skipWord('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECWindow): # type: ignore
                        value.target = record['name']
                        return value
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    # This is used by the expression evaluator to get the value of a symbol
    def v_symbol(self, record):
        record = self.getVariable(record['name'])
        keyword = record['keyword']
        if self.isObjectType(record, ECPushButton):
            pushbutton = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=pushbutton.text())
            return v
        elif self.isObjectType(record, ECLineInput):
            lineinput = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=lineinput.displayText())
            return v
        elif self.isObjectType(record, ECMultiline):
            multiline = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=multiline.toPlainText())
            return v
        elif self.isObjectType(record, ECComboBox):
            combobox = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=combobox.currentText())
            return v
        elif self.isObjectType(record, ECListBox):
            listbox = self.getInnerObject(record)
            item = listbox.currentItem()  # type: ignore
            content = item.text() if item else None  # type: ignore
            v = ECValue(domain=self.getName(), type=str, content=content)
            return v
        elif self.isObjectType(record, ECCheckBox):
            checkbox = self.getInnerObject(record)
            content = checkbox.isChecked()  # type: ignore
            v = ECValue(domain=self.getName(), type=bool, content=content)
            return v
        elif self.isObjectType(record, ECDialog):
            content = record.get('result')
            v = ECValue(domain=self.getName(), type=str, content=content)
            return v
        return None

    def v_count(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            if isinstance(object, (ECListBox, ECComboBox)):
                widget = self.getInnerObject(object)
                value = widget.count()  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
            else: raise RuntimeError(self.program, f"Object is not a listbox or combobox")

    def v_current(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            option = v.option
            if isinstance(object, (ECListBox)):
                if option == 'item':
                    content = object.getText()  # type: ignore
                elif option == 'index':
                    content = object.getIndex()  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=content)
            elif isinstance(object, (ECComboBox)):
                widget = self.getInnerObject(object)
                content = str(widget.currentText())  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=content)
            else: raise RuntimeError(self.program, f"Object is not a listbox or combobox")
    
    def v_element(self, v):
        return v.getContent()

    # A table's value handlers. The row and column are evaluated at the point of use, so
    # `the cell Row Column of Steps` can name variables rather than literals.
    def tableWidget(self, v):
        record = self.getVariable(v.target)
        return self.getInnerObject(record)

    def v_selectedRow(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.currentRow())

    def v_selectedColumn(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.currentColumn())

    def v_clickedRow(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.clickedRow)

    # The selection of a table or a listbox, read as a list of row indexes. A single-row
    # selection answers a one-item list and no selection an empty one, so one shape covers
    # every mode — and `item N of` / `the count of` read it like any other list.
    def v_selection(self, v):
        record = self.getVariable(v.target)
        widget = self.getInnerObject(record)
        rows = {index.row() for index in widget.selectionModel().selectedIndexes()}
        return ECValue(domain=self.getName(), type='list', content=sorted(rows))

    def v_clickedColumn(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.clickedColumn)

    def v_cell(self, v):
        widget = self.tableWidget(v)
        row = int(self.textify(v.row))
        column = int(self.textify(v.column))
        if 0 <= row < widget.rowCount() and 0 <= column < widget.columnCount():
            item = widget.item(row, column)
            if item is not None:
                return ECValue(domain=self.getName(), type=str, content=item.text())
        return ECValue(domain=self.getName(), type=str, content='')

    def v_rowCount(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.rowCount())

    def v_columnCount(self, v):
        widget = self.tableWidget(v)
        return ECValue(domain=self.getName(), type=int, content=widget.columnCount())

    def v_currentTab(self, v):
        record = self.getVariable(v.target)
        widget = self.getInnerObject(record)
        return ECValue(domain=self.getName(), type=int, content=widget.currentIndex())
    
    def v_empty(self, v):
        if v.type == 'object':
            record = self.getVariable(v.getName())
            object = self.getObject(record)
            value = object.isEmpty()
            return ECValue(domain=self.getName(), type=bool, content=value)  # type: ignore
        return None
    
    def v_height(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.height()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    def v_selected(self, v): return self.v_current(v)

    def v_text(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            value = object.getText()
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
    
    def v_width(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.width()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    # The window's screen position. `geometry()` excludes the window frame, so
    # these agree with `create {window} at X Y` (which calls setGeometry);
    # Qt's own x()/y() include the frame, and reading them back into setGeometry
    # walks the window up and left by the border on every restart.
    def v_x(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.geometry().x()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    def v_y(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.geometry().y()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    #############################################################################
	# Get the value of an unknown item
    def getUnknownValue(self, value):
        if self.isObjectType(value, (ECLabelWidget, ECPushButtonWidget, ECLineEditWidget, ECListBoxWidget, ECComboBoxWidget)):
            return value.text()  # type: ignore
        if self.isObjectType(value, (ECPlainTextEditWidget, ECMDPanelWidget)):
            return value.toPlainText()  # type: ignore
        if self.isObjectType(value, (ECCheckBoxWidget)):
            return value.isChecked()  # type: ignore
        if self.isObjectType(value, (ECDialogWindow)): 
            return value.result()  # type: ignore
        return None # Unable to get value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = ECValue()
        condition.negate = False # type: ignore
        return None

    #############################################################################
    # Condition handlers

    #############################################################################
    # Force the application to exit
    def force_exit(self):
        # A child process started by `start` is this run's, so it goes with the run:
        # QApplication.quit() ends the event loop but not the child.
        try:
            self.program.stopProcesses()
        except Exception:
            pass
        QApplication.quit()  # Gracefully close the application
        sys.exit(0)          # Force a complete system exit