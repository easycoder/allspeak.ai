from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLineEdit,
    QPlainTextEdit,
    QWidget,
    QStackedWidget,
    QSpacerItem,
    QSizePolicy,
    QGraphicsDropShadowEffect
)
from PySide6.QtGui import QFont
from PySide6.QtCore import Qt, QTimer, QPoint

from .as_border import Border


###############################################################################
# Keyboard — a modal on-screen keyboard for kiosk and touch environments.
#
# The keyboard pops over the calling window as a frameless dialog with a
# Border title bar (tick = accept, cross = cancel) and the keypad below.
# The receiver field stays in the window, so the text being typed is visible
# live; Enter accepts (single-line fields), the cross cancels and restores
# the field's original content.
#
# A script opens it with:
#     show keyboard {lineinput|multiline} [on {window}] [giving {var}]
class Keyboard:
    def __init__(self, program, receiver, caller=None):
        self.program = program
        self.receiver = receiver

        # The field's content at open time — restored if the user cancels.
        self.restore = receiver.getContent()

        dialog = QDialog(caller)
        self.dialog = dialog
        dialog.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        dialog.setModal(True)
        dialog.setFixedWidth(500)
        dialog.setStyleSheet('background-color: white; border: 1px solid black;')

        # Drop shadow so the keyboard reads as floating above the window
        shadow = QGraphicsDropShadowEffect(dialog)
        shadow.setBlurRadius(40)
        shadow.setOffset(0, 4)
        shadow.setColor(Qt.GlobalColor.black)
        dialog.setGraphicsEffect(shadow)

        layout = QVBoxLayout(dialog)
        border = Border()
        border.tickClicked.connect(dialog.accept)
        border.closeClicked.connect(self.reject)
        layout.addWidget(border)
        self.vk = VirtualKeyboard(receiver, dialog.accept)
        layout.addWidget(self.vk)

        # Size the dialog to its content explicitly: a parented modal dialog
        # can otherwise come up collapsed (observed offscreen, where the
        # window manager does no layout pass). The fixed width of 500 is
        # respected by adjustSize.
        dialog.adjustSize()

        # Position at the bottom of the caller window, centred horizontally
        dialog.show()  # ensure geometry is calculated before moving
        if caller is not None:
            top_left = caller.mapToGlobal(QPoint(0, 0))
            x = top_left.x() + (caller.width() - dialog.width()) // 2
            y = top_left.y() + caller.height() - dialog.height()
            dialog.move(x, y)

        dialog.exec()

    def reject(self):
        self.receiver.setContent(self.restore)
        self.dialog.reject()


###############################################################################
# TextReceiver — bridges between a text widget (lineinput or multiline) and
# the keyboard: character insertion, backspace, content read/write.
class TextReceiver:
    def __init__(self, field):
        self.field = field
        # True for multiline fields, which accept Enter as a newline rather
        # than finishing. ECLineEditWidget sets False, ECPlainTextEditWidget
        # sets True.
        self.multiline = getattr(field, 'multiline', False)

    def addCharacter(self, char):
        char = char.replace('&&', '&')
        if len(char) == 1:
            self.setContent(self.getContent() + char)
        else:
            raise ValueError('Only single characters are allowed.')

    def backspace(self):
        text = self.getContent()
        if text:
            self.setContent(text[:-1])

    def setContent(self, text):
        if isinstance(self.field, QPlainTextEdit):
            self.field.setPlainText(text)
        else:
            self.field.setText(text)

    def getContent(self):
        if isinstance(self.field, QPlainTextEdit):
            return self.field.toPlainText()
        return self.field.text()


###############################################################################
# KeyboardButton — one key. Icons are deliberately not used: the key labels
# are text ('Shift', '123', 'Enter', ...) so the keyboard needs no asset
# files and works on any system.
class KeyboardButton(QPushButton):
    def __init__(self, width, height, onClick, text):
        if text is not None:
            text = text.replace('&', '&&')  # Qt mnemonic escaping
        super().__init__(text)
        self.setFixedSize(int(width), int(height))
        self.setFont(QFont('Arial', max(10, int(height) // 2)))
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: white;
                border: none;
                border-radius: {int(height * 0.2)}px;
            }}
            QPushButton:pressed {{
                background-color: #ddd;
            }}
        """)
        self.clicked.connect(lambda: self.animate_button(onClick, text))

    def animate_button(self, onClick, text):
        # Nudge the button down and right for a press effect, then back
        self.move(self.x() + 2, self.y() + 2)
        QTimer.singleShot(200, lambda: self.move(self.x() - 2, self.y() - 2))
        onClick(text)


class KeyboardRow(QHBoxLayout):
    def __init__(self, items):
        super().__init__()
        for item in items:
            if isinstance(item, QWidget):
                self.addWidget(item)
            elif isinstance(item, QSpacerItem):
                self.addSpacerItem(item)


class KeyboardView(QVBoxLayout):
    def __init__(self, rows):
        super().__init__()
        for row in rows:
            self.addLayout(row)


###############################################################################
# VirtualKeyboard — a QStackedWidget with four keypads: lowercase letters,
# uppercase letters, numbers/symbols, and extended symbols. Shift and the
# 123/#+= keys switch between them; Back deletes; Space and Enter do the
# obvious; Enter finishes on a single-line field (accepting the dialog) or
# inserts a newline on a multiline field.
class VirtualKeyboard(QStackedWidget):
    buttonHeight = 42   # key size in pixels

    def __init__(self, receiver, onFinished):
        super().__init__()
        self.receiver = receiver
        self.onFinished = onFinished
        self.setStyleSheet('background-color: #ccc; border: none;')

        self.addKeyboardLayout0()
        self.addKeyboardLayout1()
        self.addKeyboardLayout2()
        self.addKeyboardLayout3()

    # Spacer helpers
    def _stretch(self):
        return QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)

    def _fixed(self):
        return QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum)

    def _finish(self, rows):
        view = KeyboardView(rows)
        container = QWidget()
        container.setLayout(view)
        self.addWidget(container)

    ###########################################################################
    # Layout 0: lowercase letters
    def addKeyboardLayout0(self):
        rows = [
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'qwertyuiop'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'asdfghjkl'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickShift, 'Shift'),
                self._fixed(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'zxcvbnm'],
                self._fixed(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickBack, 'Back'),
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickNumbers, '123'),
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ','),
                KeyboardButton(self.buttonHeight * 5, self.buttonHeight, self.onClickSpace, 'Space'),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, '.'),
                self._fixed(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, 'Enter'),
                self._stretch()
            ]),
        ]
        self._finish(rows)

    ###########################################################################
    # Layout 1: uppercase letters
    def addKeyboardLayout1(self):
        rows = [
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'QWERTYUIOP'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'ASDFGHJKL'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickShift, 'Shift'),
                self._fixed(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'ZXCVBNM'],
                self._fixed(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickBack, 'Back'),
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickNumbers, '123'),
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ','),
                KeyboardButton(self.buttonHeight * 5, self.buttonHeight, self.onClickSpace, 'Space'),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, '.'),
                self._fixed(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, 'Enter'),
                self._stretch()
            ]),
        ]
        self._finish(rows)

    ###########################################################################
    # Layout 2: numbers and symbols
    def addKeyboardLayout2(self):
        rows = [
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '1234567890'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '@#£&_-()=%'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickSymbols, '#+='),
                self._fixed(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '"*\'/:!?+'],
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickBack, 'Back'),
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickLetters, 'ABC'),
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ','),
                KeyboardButton(self.buttonHeight * 5.2, self.buttonHeight, self.onClickSpace, 'Space'),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, '.'),
                self._fixed(),
                KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, 'Enter'),
                self._stretch()
            ]),
        ]
        self._finish(rows)

    ###########################################################################
    # Layout 3: extended symbols
    def addKeyboardLayout3(self):
        rows = [
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '$€¥¢©®µ~¿¡'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '¼½¾[]{}<>^'],
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickNumbers, '123'),
                self._fixed(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '`;÷\\∣|¬±'],
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickBack, 'Back'),
                self._stretch()
            ]),
            KeyboardRow([
                self._stretch(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickLetters, 'ABC'),
                self._fixed(),
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ','),
                KeyboardButton(self.buttonHeight * 3, self.buttonHeight, self.onClickSpace, 'Space'),
                self._fixed(),
                *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '✕§¶°'],
                KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickEnter, 'Enter'),
                self._stretch()
            ]),
        ]
        self._finish(rows)

    def setReceiver(self, receiver):
        self.receiver = receiver

    # Key callbacks
    def onClickChar(self, keycode):
        self.receiver.addCharacter(keycode)

    def onClickShift(self, keycode):
        if self.currentIndex() == 0:
            self.setCurrentIndex(1)
        elif self.currentIndex() == 1:
            self.setCurrentIndex(0)

    def onClickLetters(self, keycode):
        self.setCurrentIndex(0)

    def onClickNumbers(self, keycode):
        self.setCurrentIndex(2)

    def onClickSymbols(self, keycode):
        self.setCurrentIndex(3)

    def onClickBack(self, keycode):
        self.receiver.backspace()

    def onClickSpace(self, keycode):
        self.receiver.addCharacter(' ')

    def onClickEnter(self, keycode):
        if self.receiver.multiline:
            self.receiver.addCharacter('\n')
        else:
            self.onFinished()
