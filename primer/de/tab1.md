# Programmieren ohne zu Programmieren

Sie haben vermutlich schon von *Vibe Coding* gehört — Sie sagen einer KI, was Sie haben möchten, und sie schreibt die Software. Das klingt nach Magie, und manchmal ist es das auch. Aber es gibt einen Haken: Die Sprache, in der sie schreibt, ist JavaScript oder Python oder etwas anderes mit Klammern und Semikolons, und wenn Sie diese Sprache nicht bereits lesen können, haben Sie keine Möglichkeit zu beurteilen, ob die Arbeit gut gemacht wurde. Sie vertrauen der KI, und wenn etwas bricht — und das wird es — sitzen Sie fest.

Richtig programmieren zu lernen ist der andere Weg, und es dauert Monate bis zur ersten nützlichen Sache. Die meisten Menschen haben diese Zeit nicht.

AllSpeak steht zwischen den beiden. Es ist eine Skriptsprache, die sich wie Deutsch liest — oder wie Englisch, Französisch oder Italienisch: Dieselbe Laufzeitumgebung führt alle vier aus, jede mit ihrer eigenen natürlichen Syntax.

## Wie sieht das aus?

Hier ist ein echter Ausschnitt:

```
    language deutsch

    variable Gruß
    lege `Hallo!` in Gruß
    logge Gruß
```

Keine Klammern, keine Semikolons, kein Rätselraten. Wenn Sie einen Satz lesen können, können Sie AllSpeak lesen.

## Kein Spielzeug

AllSpeak baut echte Software. Webanwendungen mit interaktiven Seiten und gestaltetem Layout. Kommandozeilenwerkzeuge, die mit APIs sprechen, Daten verarbeiten und Dateien verwalten. Mehrseitige Anwendungen mit Navigation, Formularen und Benutzereingabe. Live-Verbindungen über REST und MQTT. AllSpeak läuft in jedem Browser (die JavaScript-Version) oder vom Terminal aus (die Python-Version) — oder beides gemeinsam.

Das Geheimnis ist, dass es der KI egal ist, in welcher Sprache sie schreibt. Geben Sie ihr eine leistungsfähige Hochsprache, und sie liefert denselben Funktionsumfang wie in JavaScript — aber in einer Form, die Sie tatsächlich lesen, prüfen und anpassen können.

## Und es gibt ein Werkzeug, das das alles schon kennt

Das ist der Teil, den Ihnen andere Sprachen nicht geben, und deshalb haben wir **Viz** geschrieben — den AllSpeak-Editor, den der Befehl `allspeak viz` öffnet.

Viz ist kein Allzweck-Editor, der zufällig AllSpeak unterstützt. Er kennt die Sprache, und genau das erlaubt es ihm, Ihnen ein und dieselbe Datei auf drei Arten zu zeigen, von denen keine eine zweite Datei oder ein zweites Werkzeug braucht:

- **Als Text.** Das ganze Skript, die Wörter hervorgehoben — und mit dem Compiler der Sprache dahinter, sodass er prüfen kann, was Sie gerade ansehen, ohne einen Build-Schritt. Die unspektakulärste der drei, und die, die er mit jedem anderen Editor teilt.
- **Als Blöcke**, was Ihre Art ändert, ein Skript zu lesen. Es hört auf, eine Textwand zu sein, und wird eine Folge von Abschnitten: eine kurze Notiz in den Worten dessen, der sie geschrieben hat, neben dem Code, den sie beschreibt, mit der Abschnittsliste an der Seite, um zwischen ihnen zu wechseln. Sie lesen die Notiz, und der Code, von dem sie spricht, ist direkt daneben. Das funktioniert, weil die Prosa *in der Datei* steht, in der Kommentarsyntax der Sprache — und nicht in einem getrennten Dokument, das mit ihr in Übereinstimmung gehalten werden müsste.
- **Als Bild eines Laufs**: welche Teile des Programms erreicht wurden, in welcher Reihenfolge und wie oft. Jeder Lauf wird als Datei aufbewahrt und kann später wieder geöffnet werden — von Ihnen oder von jemand anderem, auf einer Maschine, die den Code nicht einmal ausführen kann.

Diese drei wären anderswo drei Produkte: ein Dokumentationsgenerator, ein Debugger oder Profiler, ein Coverage-Bericht — jedes mit eigenen Konventionen, und keines davon verpflichtet, mit der Quelle übereinzustimmen. Hier trägt die Sprache die Prosa und die Markierungen bereits: Es sind also **Ansichten einer einzigen Datei** statt getrennter Dinge, die in Übereinstimmung gehalten werden müssen.

Ein Stacktrace sagt Ihnen, dass ein Programm fehlgeschlagen ist. Ein Log ist etwas, das Sie selbst zu schreiben beschlossen haben. Eine Aufzeichnung ist der Lauf selbst — und sogar ihre Markierungen `viz start` und `viz stop` sind gewöhnliche Schlüsselwörter: Ein Skript, das sie trägt, läuft genau wie ohne sie, und es gibt keinen „Debug-Build“, der neben dem echten gepflegt werden müsste.

## Was Sie tatsächlich tun

Sie schreiben den Code nicht. Sie beschreiben einem Agenten, was Sie wollen — Claude Code, Reasonix oder den, den Sie bereits nutzen — und er schreibt das AllSpeak. Ihre Aufgabe ist es, zu lesen, was er geschrieben hat, und zu sagen, ob es richtig ist.

Deshalb ist die Sprache so schlicht, und deshalb trägt jeder Abschnitt eines Skripts eine kurze Notiz in klarer Sprache, geschrieben von der KI, die sagt, was gemeint war. Sie prüfen die *Absicht*, nicht Code, den Sie entziffern müssen.

**Weiter: das Register Erste Schritte.** Es richtet ein Projekt ein und baut mit Ihnen eines auf, in etwa fünf Minuten.
