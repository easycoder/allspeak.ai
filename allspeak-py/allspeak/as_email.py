import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .as_handler import Handler
from .as_language import language
from .as_classes import FatalError, RuntimeError

class Email(Handler):

    def __init__(self, compiler):
        super().__init__(compiler)

    def getName(self):
        return 'email'

    def processOr(self, command, orHere):
        self.add(command)
        # Same rule as as_core's processOr: 'or' recovers and ends the thread,
        # 'on failure' recovers and carries on. See the note there.
        peek = language.reverse_word(self.peek())
        matched = False
        continues = False
        if peek == 'or':
            self.nextToken()
            matched = True
        elif peek == 'on':
            mark = self.compiler.index
            self.nextToken()
            if language.reverse_word(self.peek()) == 'failure':
                self.nextToken()
                matched = True
                continues = True
            else:
                self.compiler.index = mark
        if not matched:
            return
        self.nextToken()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        skip = self.getCodeSize()
        self.add(cmd)
        self.getCommandAt(orHere)['or'] = self.getCodeSize()
        self.compileOne()
        if not continues:
            stop = {}
            stop['lino'] = command['lino']
            stop['domain'] = 'core'
            stop['keyword'] = 'stop'
            stop['debug'] = False
            self.add(stop)
        self.getCommandAt(skip)['goto'] = self.getCodeSize()

    #############################################################################
    # Keyword handlers

    # send email
    #   to {value}
    #   from {value}
    #   subject {value}
    #   body {value}
    #   via {value}
    #   user {value}
    #   password {value}
    #   [port {value}]
    #   [or ...]
    def k_send(self, command):
        if self.nextIsWord('email'):
            if self.nextIsWord('to'):
                command['to'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "to"')
            if self.nextIsWord('from'):
                command['from'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "from"')
            if self.nextIsWord('subject'):
                command['subject'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "subject"')
            if self.nextIsWord('body'):
                command['body'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "body"')
            if self.nextIsWord('via'):
                command['via'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "via"')
            if self.nextIsWord('user'):
                command['user'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "user"')
            if self.nextIsWord('password'):
                command['password'] = self.nextValue()
            else:
                FatalError(self.compiler, '"send email" requires "password"')
            # Optional port (default 465 for SMTP_SSL)
            if language.reverse_word(self.peek()) == 'port':
                self.nextToken()
                command['port'] = self.nextValue()
            else:
                command['port'] = None
            # Optional html flag
            if language.reverse_word(self.peek()) == 'html':
                self.nextToken()
                command['html'] = True
            else:
                command['html'] = False
            command['or'] = None
            sendCmd = self.getCodeSize()
            self.processOr(command, sendCmd)
            return True
        return False

    def r_send(self, command):
        try:
            to_addr = self.textify(command['to'])
            from_addr = self.textify(command['from'])
            subject = self.textify(command['subject'])
            body = self.textify(command['body'])
            smtp_host = self.textify(command['via'])
            smtp_user = self.textify(command['user'])
            smtp_pass = self.textify(command['password'])
            port = int(self.textify(command['port'])) if command['port'] else 465
            is_html = command['html']

            msg = MIMEMultipart()
            msg['From'] = from_addr
            msg['To'] = to_addr
            msg['Subject'] = subject
            subtype = 'html' if is_html else 'plain'
            msg.attach(MIMEText(body, subtype))

            server = smtplib.SMTP_SSL(smtp_host, port)
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_addr, to_addr.split(','), msg.as_string())
            server.quit()
        except Exception as e:
            self.program.errorMessage = str(e)
            if command['or'] is not None:
                return command['or']
            else:
                RuntimeError(self.program, self.program.errorMessage)
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition
