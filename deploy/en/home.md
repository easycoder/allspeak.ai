<h2>Write code in your own language</h2>

<p>AllSpeak is a scripting language designed to be written in <strong>any human language</strong>.
Whether you think in English, Italian, French or Japanese, you can write programs
using words and grammar that feel natural to you.</p>

<p>Every language compiles to the same internal form and runs on the same engine.
An English script and an Italian script can do exactly the same things &mdash;
they just express them differently.</p>

<h3>What can AllSpeak do?</h3>

<ul>
<li>Build interactive web pages and applications</li>
<li>Process data, text and JSON</li>
<li>Connect to REST APIs and MQTT services</li>
<li>Create animations and visual effects</li>
</ul>

<h2>Frequently asked questions</h2>

<h3>What is AllSpeak?</h3>
<p>AllSpeak is a high-level scripting language designed to be written by AI and read by humans, in any of several human languages — currently English, French, German and Italian. The same engine runs all of them, so non-English speakers can code in their own language without losing access to AI assistance.</p>

<h3>What does AllSpeak code look like?</h3>
<p>It reads close to natural language and avoids mathematical symbols where possible:</p>
<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  variable Greeting
  put `Hello, AllSpeak!` into Greeting
  log Greeting
</pre>

<h3>How is AllSpeak used?</h3>
<p>You write prompts to an AI assistant in your own language, and the AI produces AllSpeak code in that same language. Because the code is readable, you can verify what the AI did before running it. AllSpeak runs in the browser via a single <code>&lt;script&gt;</code> tag, or from the command line via <code>pip install allspeak-ai</code>.</p>

<h3>Is AllSpeak better than mainstream coding tools?</h3>
<p>For a wide range of tasks, yes — though not because the runtime is more capable than JavaScript or Python. The code AI produces in AllSpeak is dramatically more readable, so a domain expert can verify what was written. With mainstream languages, you're often trusting AI output you can't easily check.</p>

<h3>What kinds of projects is AllSpeak for?</h3>
<p>Web applications, dashboards, REST and MQTT integrations, SQLite-backed services, Google Maps mashups, mobile-first webapps. The AllSpeak code editor and the multilingual chat application bundled with the project are themselves written in AllSpeak.</p>

<h3>What if I don't understand the code the AI produces?</h3>
<p>That's the case AllSpeak is designed to prevent. Scripts read close to natural language — <code>set the content of Heading to `Welcome`</code> does what it says. If a specific construct is still unfamiliar, your AI agent has a quick reference loaded and can explain it inline.</p>

<h3>Is AllSpeak free?</h3>
<p>Yes. AllSpeak is open source under the Apache 2.0 license. The full source is at <a href="https://github.com/easycoder/allspeak.ai" style="color:#00d4ff;text-decoration:none">github.com/easycoder/allspeak.ai</a>.</p>

<h3>How does AllSpeak relate to JavaScript and Python?</h3>
<p>AllSpeak runs on either a JavaScript runtime (in the browser) or a Python runtime (on the command line). It's not a replacement for those languages — it's a higher-level layer above them. Plugins are written in JavaScript or Python and AllSpeak gives them a script-friendly vocabulary in any human language.</p>

<h3>Where do I start?</h3>
<p>Work through the <a href="primer.html" style="color:#00d4ff;text-decoration:none">Primer</a> for a guided introduction, browse the <a href="../learn/" style="color:#00d4ff;text-decoration:none">Learn</a> curriculum, or grab a starter pack to drive an AI coding assistant.</p>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"What is AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak is a high-level scripting language designed to be written by AI and read by humans, in any of several human languages — currently English, French, German and Italian. The same engine runs all of them, so non-English speakers can code in their own language without losing access to AI assistance."}},
{"@type":"Question","name":"What does AllSpeak code look like?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak code reads close to natural language and avoids mathematical symbols where possible. Three lines of valid AllSpeak: variable Greeting; put `Hello, AllSpeak!` into Greeting; log Greeting."}},
{"@type":"Question","name":"How is AllSpeak used?","acceptedAnswer":{"@type":"Answer","text":"You write prompts to an AI assistant in your own language, and the AI produces AllSpeak code in that same language. Because the code is readable, you can verify what the AI did before running it. AllSpeak runs in the browser via a single script tag, or from the command line via pip install allspeak-ai."}},
{"@type":"Question","name":"Is AllSpeak better than mainstream coding tools?","acceptedAnswer":{"@type":"Answer","text":"For a wide range of tasks, yes — though not because the runtime is more capable than JavaScript or Python. The code AI produces in AllSpeak is dramatically more readable, so a domain expert can verify what was written. With mainstream languages, you're often trusting AI output you can't easily check."}},
{"@type":"Question","name":"What kinds of projects is AllSpeak for?","acceptedAnswer":{"@type":"Answer","text":"Web applications, dashboards, REST and MQTT integrations, SQLite-backed services, Google Maps mashups, mobile-first webapps. The AllSpeak code editor and the multilingual chat application bundled with the project are themselves written in AllSpeak."}},
{"@type":"Question","name":"What if I don't understand the code the AI produces?","acceptedAnswer":{"@type":"Answer","text":"That's the case AllSpeak is designed to prevent. Scripts read close to natural language. If a specific construct is still unfamiliar, your AI agent has a quick reference loaded and can explain it inline."}},
{"@type":"Question","name":"Is AllSpeak free?","acceptedAnswer":{"@type":"Answer","text":"Yes. AllSpeak is open source under the Apache 2.0 license. The full source is at github.com/easycoder/allspeak.ai."}},
{"@type":"Question","name":"How does AllSpeak relate to JavaScript and Python?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak runs on either a JavaScript runtime (in the browser) or a Python runtime (on the command line). It is not a replacement for those languages — it is a higher-level layer above them. Plugins are written in JavaScript or Python and AllSpeak gives them a script-friendly vocabulary in any human language."}},
{"@type":"Question","name":"Where do I start?","acceptedAnswer":{"@type":"Answer","text":"Work through the Primer for a guided introduction, browse the Learn curriculum, or grab a starter pack to drive an AI coding assistant."}}
]}
</script>
