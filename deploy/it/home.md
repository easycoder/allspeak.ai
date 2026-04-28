<h2>Scrivi codice nella tua lingua</h2>

<p>AllSpeak è un linguaggio di scripting progettato per essere scritto in
<strong>qualsiasi lingua umana</strong>.
Che tu pensi in italiano, inglese, francese o giapponese, puoi scrivere programmi
usando parole e grammatica che ti sono naturali.</p>

<p>Ogni lingua viene compilata nella stessa forma interna e gira sullo stesso motore.
Uno script italiano e uno inglese possono fare esattamente le stesse cose —
le esprimono solo in modo diverso.</p>

<h3>Cosa può fare AllSpeak?</h3>

<ul>
<li>Costruire pagine web e applicazioni interattive</li>
<li>Elaborare dati, testo e JSON</li>
<li>Collegarsi a API REST e servizi MQTT</li>
<li>Creare animazioni ed effetti visivi</li>
</ul>

<h3>Esempio</h3>

<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  language it

  variabile Saluto
  metti `Ciao, mondo!` in Saluto
  registra Saluto
</pre>

<h2>Domande frequenti</h2>

<h3>Cos'è AllSpeak?</h3>
<p>AllSpeak è un linguaggio di scripting di alto livello progettato per essere scritto dall'IA e letto dagli esseri umani, in una di più lingue umane — attualmente English, italiano, français e Deutsch. Lo stesso motore esegue tutte le versioni, così chi non parla inglese può programmare nella propria lingua senza rinunciare all'assistenza dell'IA.</p>

<h3>Come si presenta il codice AllSpeak?</h3>
<p>Si legge in modo simile al linguaggio naturale ed evita i simboli matematici dove possibile:</p>
<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  language it

  variabile Saluto
  metti `Ciao, AllSpeak!` in Saluto
  registra Saluto
</pre>

<h3>Come si usa AllSpeak?</h3>
<p>Scrivi i prompt a un assistente IA nella tua lingua e l'IA produce codice AllSpeak nella stessa lingua. Poiché il codice è leggibile, puoi verificare ciò che l'IA ha fatto prima di eseguirlo. AllSpeak gira nel browser tramite un singolo tag <code>&lt;script&gt;</code>, oppure da riga di comando con <code>pip install allspeak-ai</code>.</p>

<h3>AllSpeak è migliore degli strumenti di programmazione tradizionali?</h3>
<p>Per molti compiti sì — non perché il runtime sia più potente di JavaScript o Python, ma perché il codice prodotto dall'IA in AllSpeak è notevolmente più leggibile: un esperto del dominio può verificare cosa è stato scritto. Con i linguaggi tradizionali ti fidi spesso di un output dell'IA che non puoi controllare facilmente.</p>

<h3>Per quali progetti è adatto AllSpeak?</h3>
<p>Applicazioni web, dashboard, integrazioni REST e MQTT, servizi basati su SQLite, mashup di Google Maps, webapp mobile-first. L'editor di codice AllSpeak e l'applicazione di chat multilingue inclusi nel progetto sono scritti in AllSpeak.</p>

<h3>E se non capisco il codice prodotto dall'IA?</h3>
<p>È esattamente il caso che AllSpeak è progettato per evitare. Gli script si leggono come linguaggio naturale — <code>imposta il contenuto di Titolo a `Benvenuto`</code> fa quello che dice. Se un costrutto specifico ti è sconosciuto, il tuo assistente IA ha un riferimento rapido caricato e può spiegartelo direttamente.</p>

<h3>AllSpeak è gratuito?</h3>
<p>Sì. AllSpeak è open source con licenza Apache 2.0. Il codice sorgente completo è su <a href="https://github.com/easycoder/allspeak.ai">github.com/easycoder/allspeak.ai</a>.</p>

<h3>Che rapporto ha AllSpeak con JavaScript e Python?</h3>
<p>AllSpeak gira su un runtime JavaScript (nel browser) o un runtime Python (da riga di comando). Non sostituisce quei linguaggi — è uno strato di livello più alto sopra di essi. I plugin sono scritti in JavaScript o Python e AllSpeak fornisce loro un vocabolario adatto agli script in qualsiasi lingua umana.</p>

<h3>Da dove inizio?</h3>
<p>Segui il <a href="primer.html">Primer</a> per un'introduzione guidata, oppure prendi uno starter pack per pilotare un assistente di coding IA.</p>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Cos'è AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak è un linguaggio di scripting di alto livello progettato per essere scritto dall'IA e letto dagli esseri umani, in una di più lingue umane — attualmente English, italiano, français e Deutsch. Lo stesso motore esegue tutte le versioni, così chi non parla inglese può programmare nella propria lingua senza rinunciare all'assistenza dell'IA."}},
{"@type":"Question","name":"Come si presenta il codice AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"Si legge in modo simile al linguaggio naturale ed evita i simboli matematici dove possibile. Tre righe di AllSpeak valido: variabile Saluto; metti `Ciao, AllSpeak!` in Saluto; registra Saluto."}},
{"@type":"Question","name":"Come si usa AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"Scrivi i prompt a un assistente IA nella tua lingua e l'IA produce codice AllSpeak nella stessa lingua. Poiché il codice è leggibile, puoi verificare ciò che l'IA ha fatto prima di eseguirlo. AllSpeak gira nel browser tramite un singolo tag script, oppure da riga di comando con pip install allspeak-ai."}},
{"@type":"Question","name":"AllSpeak è migliore degli strumenti di programmazione tradizionali?","acceptedAnswer":{"@type":"Answer","text":"Per molti compiti sì — non perché il runtime sia più potente di JavaScript o Python, ma perché il codice prodotto dall'IA in AllSpeak è notevolmente più leggibile: un esperto del dominio può verificare cosa è stato scritto. Con i linguaggi tradizionali ti fidi spesso di un output dell'IA che non puoi controllare facilmente."}},
{"@type":"Question","name":"Per quali progetti è adatto AllSpeak?","acceptedAnswer":{"@type":"Answer","text":"Applicazioni web, dashboard, integrazioni REST e MQTT, servizi basati su SQLite, mashup di Google Maps, webapp mobile-first. L'editor di codice AllSpeak e l'applicazione di chat multilingue inclusi nel progetto sono scritti in AllSpeak."}},
{"@type":"Question","name":"E se non capisco il codice prodotto dall'IA?","acceptedAnswer":{"@type":"Answer","text":"È esattamente il caso che AllSpeak è progettato per evitare. Gli script si leggono come linguaggio naturale. Se un costrutto specifico ti è sconosciuto, il tuo assistente IA ha un riferimento rapido caricato e può spiegartelo direttamente."}},
{"@type":"Question","name":"AllSpeak è gratuito?","acceptedAnswer":{"@type":"Answer","text":"Sì. AllSpeak è open source con licenza Apache 2.0. Il codice sorgente completo è su github.com/easycoder/allspeak.ai."}},
{"@type":"Question","name":"Che rapporto ha AllSpeak con JavaScript e Python?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak gira su un runtime JavaScript (nel browser) o un runtime Python (da riga di comando). Non sostituisce quei linguaggi — è uno strato di livello più alto sopra di essi. I plugin sono scritti in JavaScript o Python e AllSpeak fornisce loro un vocabolario adatto agli script in qualsiasi lingua umana."}},
{"@type":"Question","name":"Da dove inizio?","acceptedAnswer":{"@type":"Answer","text":"Segui il Primer per un'introduzione guidata, oppure prendi uno starter pack per pilotare un assistente di coding IA."}}
]}
</script>
