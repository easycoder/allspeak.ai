AllSpeak.version = `250824`;
AllSpeak.timestamp = Date.now();
AllSpeak.writeStartupTrace(`AllSpeak loaded; waiting for page`);

function AllSpeak_Startup() {
	AllSpeak.writeStartupTrace(`window.onload fired`);
	AllSpeak.writeStartupTrace(`${Date.now() - AllSpeak.timestamp} ms: Start AllSpeak`);
	AllSpeak.timestamp = Date.now();
	AllSpeak.scripts = {};
	// Initialize the language pack (default: English, unless one is already loaded)
	if (!AllSpeak_Language.pack && typeof AllSpeak_LanguagePack_en !== `undefined`) {
		AllSpeak_Language.init(AllSpeak_LanguagePack_en);
	}
	window.AllSpeak = AllSpeak;
	const script = document.getElementById(`allspeak-script`);
	if (script) {
		AllSpeak.writeStartupTrace(`Found #allspeak-script (${script.innerText.split(`\n`).length} lines)`);
		script.style.display = `none`;
		try {
			AllSpeak.writeStartupTrace(`Calling AllSpeak.start`);
			AllSpeak.start(script.innerText);
			AllSpeak.writeStartupTrace(`AllSpeak.start returned`);
		}
		catch (err) {
			AllSpeak.reportError(err);
		}
	} else {
		AllSpeak.writeStartupTrace(`No #allspeak-script element found`);
	}
}

// For browsers
window.onload = AllSpeak_Startup;
