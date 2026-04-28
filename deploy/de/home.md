<h2>Programmieren Sie in Ihrer eigenen Sprache</h2>

<p>AllSpeak ist eine Skriptsprache, die in <strong>jeder menschlichen Sprache</strong> geschrieben werden kann.
Ob Sie in Deutsch, Englisch, Italienisch oder Japanisch denken: Sie können Programme
mit Wörtern und Grammatik schreiben, die sich für Sie natürlich anfühlen.</p>

<p>Jede Sprache wird in dieselbe interne Form kompiliert und läuft auf derselben Laufzeitumgebung.
Ein deutsches und ein englisches Skript können genau dasselbe tun &mdash;
sie drücken es lediglich unterschiedlich aus.</p>

<h3>Was kann AllSpeak?</h3>

<ul>
<li>Interaktive Webseiten und Anwendungen bauen</li>
<li>Daten, Text und JSON verarbeiten</li>
<li>REST-APIs und MQTT-Dienste anbinden</li>
<li>Animationen und visuelle Effekte erzeugen</li>
</ul>

<h3>Beispiel</h3>

<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  language de

  variable Gruss
  setze Gruss auf `Hallo, Welt!`
  protokolliere Gruss
</pre>

<h2>Häufig gestellte Fragen</h2>

<h3>Was ist AllSpeak?</h3>
<p>AllSpeak ist eine hochrangige Skriptsprache, die so entworfen wurde, dass KI sie schreibt und Menschen sie lesen — in einer von mehreren menschlichen Sprachen, derzeit English, italiano, français und Deutsch. Dieselbe Laufzeit führt alle Versionen aus, so dass Nicht-Englischsprachige in ihrer eigenen Sprache programmieren können, ohne auf KI-Unterstützung zu verzichten.</p>

<h3>Wie sieht AllSpeak-Code aus?</h3>
<p>Der Code liest sich wie natürliche Sprache und vermeidet mathematische Symbole, wo möglich:</p>
<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  language de

  variable Gruss
  lege `Hallo, AllSpeak!` in Gruss
  logge Gruss
</pre>

<h3>Wie wird AllSpeak verwendet?</h3>
<p>Sie schreiben Prompts an einen KI-Assistenten in Ihrer eigenen Sprache, und die KI erzeugt AllSpeak-Code in derselben Sprache. Da der Code lesbar ist, können Sie überprüfen, was die KI getan hat, bevor Sie ihn ausführen. AllSpeak läuft im Browser über ein einzelnes <code>&lt;script&gt;</code>-Tag oder von der Kommandozeile aus über <code>pip install allspeak-ai</code>.</p>

<h3>Ist AllSpeak besser als gängige Programmierwerkzeuge?</h3>
<p>Für viele Aufgaben ja — nicht weil die Laufzeit mächtiger wäre als JavaScript oder Python, sondern weil der von der KI erzeugte AllSpeak-Code deutlich lesbarer ist: Eine Fachperson kann überprüfen, was tatsächlich geschrieben wurde. Bei klassischen Sprachen vertraut man oft KI-Code, den man nicht leicht prüfen kann.</p>

<h3>Für welche Projekte eignet sich AllSpeak?</h3>
<p>Webanwendungen, Dashboards, REST- und MQTT-Integrationen, SQLite-gestützte Dienste, Google-Maps-Mashups, mobile-first Webapps. Der AllSpeak-Code-Editor und die mehrsprachige Chat-Anwendung, die mit dem Projekt geliefert werden, sind selbst in AllSpeak geschrieben.</p>

<h3>Was, wenn ich den von der KI erzeugten Code nicht verstehe?</h3>
<p>Genau das ist der Fall, den AllSpeak verhindern soll. Skripte lesen sich wie natürliche Sprache — <code>setze den Inhalt von Überschrift auf `Willkommen`</code> tut, was es sagt. Wenn ein bestimmter Befehl unbekannt ist, hat Ihr KI-Agent eine Kurzreferenz geladen und kann ihn direkt erklären.</p>

<h3>Ist AllSpeak kostenlos?</h3>
<p>Ja. AllSpeak ist Open Source unter der Apache-2.0-Lizenz. Der vollständige Quellcode liegt auf <a href="https://github.com/easycoder/allspeak.ai">github.com/easycoder/allspeak.ai</a>.</p>

<h3>Wie verhält sich AllSpeak zu JavaScript und Python?</h3>
<p>AllSpeak läuft entweder auf einer JavaScript-Laufzeit (im Browser) oder einer Python-Laufzeit (auf der Kommandozeile). Es ist kein Ersatz für diese Sprachen — es ist eine Schicht auf einer höheren Ebene darüber. Plugins werden in JavaScript oder Python geschrieben, und AllSpeak gibt ihnen ein skriptfreundliches Vokabular in jeder menschlichen Sprache.</p>

<h3>Wo fange ich an?</h3>
<p>Arbeiten Sie den <a href="primer.html">Primer</a> für eine geführte Einführung durch, oder holen Sie sich ein Starter-Pack, um einen KI-Coding-Assistenten zu steuern.</p>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Was ist AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak ist eine hochrangige Skriptsprache, die so entworfen wurde, dass KI sie schreibt und Menschen sie lesen — in einer von mehreren menschlichen Sprachen, derzeit English, italiano, français und Deutsch. Dieselbe Laufzeit führt alle Versionen aus, so dass Nicht-Englischsprachige in ihrer eigenen Sprache programmieren können, ohne auf KI-Unterstützung zu verzichten."}},
{"@type":"Question","name":"Wie sieht AllSpeak-Code aus?","acceptedAnswer":{"@type":"Answer","text":"Der Code liest sich wie natürliche Sprache und vermeidet mathematische Symbole, wo möglich. Drei Zeilen gültiger AllSpeak: variable Gruss; lege `Hallo, AllSpeak!` in Gruss; logge Gruss."}},
{"@type":"Question","name":"Wie wird AllSpeak verwendet?","acceptedAnswer":{"@type":"Answer","text":"Sie schreiben Prompts an einen KI-Assistenten in Ihrer eigenen Sprache, und die KI erzeugt AllSpeak-Code in derselben Sprache. Da der Code lesbar ist, können Sie überprüfen, was die KI getan hat, bevor Sie ihn ausführen. AllSpeak läuft im Browser über ein einzelnes script-Tag oder von der Kommandozeile aus über pip install allspeak-ai."}},
{"@type":"Question","name":"Ist AllSpeak besser als gängige Programmierwerkzeuge?","acceptedAnswer":{"@type":"Answer","text":"Für viele Aufgaben ja — nicht weil die Laufzeit mächtiger wäre als JavaScript oder Python, sondern weil der von der KI erzeugte AllSpeak-Code deutlich lesbarer ist: Eine Fachperson kann überprüfen, was tatsächlich geschrieben wurde. Bei klassischen Sprachen vertraut man oft KI-Code, den man nicht leicht prüfen kann."}},
{"@type":"Question","name":"Für welche Projekte eignet sich AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"Webanwendungen, Dashboards, REST- und MQTT-Integrationen, SQLite-gestützte Dienste, Google-Maps-Mashups, mobile-first Webapps. Der AllSpeak-Code-Editor und die mehrsprachige Chat-Anwendung, die mit dem Projekt geliefert werden, sind selbst in AllSpeak geschrieben."}},
{"@type":"Question","name":"Was, wenn ich den von der KI erzeugten Code nicht verstehe?","acceptedAnswer":{"@type":"Answer","text":"Genau das ist der Fall, den AllSpeak verhindern soll. Skripte lesen sich wie natürliche Sprache. Wenn ein bestimmter Befehl unbekannt ist, hat Ihr KI-Agent eine Kurzreferenz geladen und kann ihn direkt erklären."}},
{"@type":"Question","name":"Ist AllSpeak kostenlos?","acceptedAnswer":{"@type":"Answer","text":"Ja. AllSpeak ist Open Source unter der Apache-2.0-Lizenz. Der vollständige Quellcode liegt auf github.com/easycoder/allspeak.ai."}},
{"@type":"Question","name":"Wie verhält sich AllSpeak zu JavaScript und Python?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak läuft entweder auf einer JavaScript-Laufzeit (im Browser) oder einer Python-Laufzeit (auf der Kommandozeile). Es ist kein Ersatz für diese Sprachen — es ist eine Schicht auf einer höheren Ebene darüber. Plugins werden in JavaScript oder Python geschrieben, und AllSpeak gibt ihnen ein skriptfreundliches Vokabular in jeder menschlichen Sprache."}},
{"@type":"Question","name":"Wo fange ich an?","acceptedAnswer":{"@type":"Answer","text":"Arbeiten Sie den Primer für eine geführte Einführung durch, oder holen Sie sich ein Starter-Pack, um einen KI-Coding-Assistenten zu steuern."}}
]}
</script>
