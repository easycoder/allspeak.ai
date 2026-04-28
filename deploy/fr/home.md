<h2>Écrivez du code dans votre propre langue</h2>

<p>AllSpeak est un langage de script conçu pour être écrit dans <strong>n'importe quelle langue humaine</strong>.
Que vous pensiez en français, en anglais, en italien ou en japonais, vous pouvez écrire des programmes
avec des mots et une grammaire qui vous sont naturels.</p>

<p>Chaque langue se compile vers la même forme interne et s'exécute sur le même moteur.
Un script en français et un script en anglais peuvent faire exactement les mêmes choses &mdash;
ils l'expriment simplement différemment.</p>

<h3>Que peut faire AllSpeak ?</h3>

<ul>
<li>Créer des pages web et des applications interactives</li>
<li>Traiter des données, du texte et du JSON</li>
<li>Se connecter à des API REST et à des services MQTT</li>
<li>Créer des animations et des effets visuels</li>
</ul>

<h2>Questions fréquentes</h2>

<h3>Qu'est-ce qu'AllSpeak ?</h3>
<p>AllSpeak est un langage de script de haut niveau conçu pour être écrit par l'IA et lu par les humains, dans plusieurs langues humaines — actuellement français, allemand, anglais et italien. Le même moteur exécute toutes les versions, ce qui permet aux non-anglophones de programmer dans leur propre langue sans renoncer à l'assistance par IA.</p>

<h3>À quoi ressemble le code AllSpeak ?</h3>
<p>Il se lit de manière proche du langage naturel et évite les symboles mathématiques quand c'est possible :</p>
<pre style="background:#1a2633;padding:1em;border-radius:8px;color:#a0d0f0;overflow-x:auto">
  language fr

  variable Salutation
  mets `Bonjour, AllSpeak !` dans Salutation
  journalise Salutation
</pre>

<h3>Comment AllSpeak s'utilise-t-il ?</h3>
<p>Vous écrivez vos prompts à un assistant IA dans votre propre langue, et l'IA produit du code AllSpeak dans cette même langue. Comme le code est lisible, vous pouvez vérifier ce que l'IA a fait avant de l'exécuter. AllSpeak fonctionne dans le navigateur via une seule balise <code>&lt;script&gt;</code>, ou en ligne de commande via <code>pip install allspeak-ai</code>.</p>

<h3>AllSpeak est-il meilleur que les outils de programmation classiques ?</h3>
<p>Pour de nombreuses tâches, oui — non parce que le moteur soit plus puissant que JavaScript ou Python, mais parce que le code produit par l'IA en AllSpeak est nettement plus lisible : un expert du domaine peut vérifier ce qui a été écrit. Avec les langages classiques, on fait souvent confiance à un code de l'IA qu'on ne peut pas facilement contrôler.</p>

<h3>Pour quels types de projets AllSpeak est-il adapté ?</h3>
<p>Applications web, tableaux de bord, intégrations REST et MQTT, services adossés à SQLite, mashups Google Maps, webapps mobile-first. L'éditeur de code AllSpeak et l'application de chat multilingue fournis avec le projet sont eux-mêmes écrits en AllSpeak.</p>

<h3>Et si je ne comprends pas le code produit par l'IA ?</h3>
<p>C'est précisément le cas qu'AllSpeak est conçu pour éviter. Les scripts se lisent comme un langage naturel — <code>définis le contenu de Titre à `Bienvenue`</code> fait ce qu'il dit. Si une commande spécifique vous est inconnue, votre agent IA dispose d'une référence rapide et peut vous l'expliquer immédiatement.</p>

<h3>AllSpeak est-il gratuit ?</h3>
<p>Oui. AllSpeak est open source sous licence Apache 2.0. Le code source complet se trouve sur <a href="https://github.com/easycoder/allspeak.ai" style="color:#00d4ff;text-decoration:none">github.com/easycoder/allspeak.ai</a>.</p>

<h3>Quel est le rapport entre AllSpeak, JavaScript et Python ?</h3>
<p>AllSpeak s'exécute sur un runtime JavaScript (dans le navigateur) ou un runtime Python (en ligne de commande). Ce n'est pas un remplaçant pour ces langages — c'est une couche de plus haut niveau au-dessus d'eux. Les plugins sont écrits en JavaScript ou en Python et AllSpeak leur fournit un vocabulaire adapté aux scripts dans n'importe quelle langue humaine.</p>

<h3>Par où commencer ?</h3>
<p>Suivez le <a href="primer.html" style="color:#00d4ff;text-decoration:none">Primer</a> pour une introduction guidée, ou récupérez un starter pack pour piloter un assistant de codage IA.</p>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"Qu'est-ce qu'AllSpeak ?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak est un langage de script de haut niveau conçu pour être écrit par l'IA et lu par les humains, dans plusieurs langues humaines — actuellement français, allemand, anglais et italien. Le même moteur exécute toutes les versions, ce qui permet aux non-anglophones de programmer dans leur propre langue sans renoncer à l'assistance par IA."}},
{"@type":"Question","name":"À quoi ressemble le code AllSpeak ?","acceptedAnswer":{"@type":"Answer","text":"Il se lit de manière proche du langage naturel et évite les symboles mathématiques quand c'est possible. Trois lignes d'AllSpeak valide : variable Salutation ; mets `Bonjour, AllSpeak !` dans Salutation ; journalise Salutation."}},
{"@type":"Question","name":"Comment AllSpeak s'utilise-t-il ?","acceptedAnswer":{"@type":"Answer","text":"Vous écrivez vos prompts à un assistant IA dans votre propre langue, et l'IA produit du code AllSpeak dans cette même langue. Comme le code est lisible, vous pouvez vérifier ce que l'IA a fait avant de l'exécuter. AllSpeak fonctionne dans le navigateur via une seule balise script, ou en ligne de commande via pip install allspeak-ai."}},
{"@type":"Question","name":"AllSpeak est-il meilleur que les outils de programmation classiques ?","acceptedAnswer":{"@type":"Answer","text":"Pour de nombreuses tâches, oui — non parce que le moteur soit plus puissant que JavaScript ou Python, mais parce que le code produit par l'IA en AllSpeak est nettement plus lisible : un expert du domaine peut vérifier ce qui a été écrit. Avec les langages classiques, on fait souvent confiance à un code de l'IA qu'on ne peut pas facilement contrôler."}},
{"@type":"Question","name":"Pour quels types de projets AllSpeak est-il adapté ?","acceptedAnswer":{"@type":"Answer","text":"Applications web, tableaux de bord, intégrations REST et MQTT, services adossés à SQLite, mashups Google Maps, webapps mobile-first. L'éditeur de code AllSpeak et l'application de chat multilingue fournis avec le projet sont eux-mêmes écrits en AllSpeak."}},
{"@type":"Question","name":"Et si je ne comprends pas le code produit par l'IA ?","acceptedAnswer":{"@type":"Answer","text":"C'est précisément le cas qu'AllSpeak est conçu pour éviter. Les scripts se lisent comme un langage naturel. Si une commande spécifique vous est inconnue, votre agent IA dispose d'une référence rapide et peut vous l'expliquer immédiatement."}},
{"@type":"Question","name":"AllSpeak est-il gratuit ?","acceptedAnswer":{"@type":"Answer","text":"Oui. AllSpeak est open source sous licence Apache 2.0. Le code source complet se trouve sur github.com/easycoder/allspeak.ai."}},
{"@type":"Question","name":"Quel est le rapport entre AllSpeak, JavaScript et Python ?","acceptedAnswer":{"@type":"Answer","text":"AllSpeak s'exécute sur un runtime JavaScript (dans le navigateur) ou un runtime Python (en ligne de commande). Ce n'est pas un remplaçant pour ces langages — c'est une couche de plus haut niveau au-dessus d'eux. Les plugins sont écrits en JavaScript ou en Python et AllSpeak leur fournit un vocabulaire adapté aux scripts dans n'importe quelle langue humaine."}},
{"@type":"Question","name":"Par où commencer ?","acceptedAnswer":{"@type":"Answer","text":"Suivez le Primer pour une introduction guidée, ou récupérez un starter pack pour piloter un assistant de codage IA."}}
]}
</script>
