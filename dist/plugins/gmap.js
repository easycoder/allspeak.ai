
const AllSpeak_GMap = {

	name: `AllSpeak_GMap`,

	Create: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const type = symbolRecord.keyword;
				switch (type) {
				case `gmap`:
					if (compiler.nextIsWord(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (parentRecord.keyword === `div`) {
								compiler.next();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `create`,
									type,
									lino,
									name: symbolRecord.name,
									parent: parentRecord.name
								});
								return true;
							}
						}
					}
					return false;
				case `marker`:
					if (compiler.nextIsWord(`in`)) {
						if (compiler.nextIsSymbol()) {
							const parentRecord = compiler.getSymbolRecord();
							if (parentRecord.keyword === `gmap`) {
								compiler.next();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `create`,
									type,
									lino,
									name: symbolRecord.name,
									map: parentRecord.name
								});
								return true;
							}
						}
					}
					return false;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			switch (command.type) {
			case `gmap`:
				symbolRecord.parent = program.getSymbolRecord(command.parent);
				symbolRecord.markers = [];
				break;
			case `marker`:
				const mapRecord = program.getSymbolRecord(command.map);
				const element = new google.maps.Marker({
					map: mapRecord.map
				});
				symbolRecord.element[symbolRecord.index] = element;
				mapRecord.markers.push(element);
				element.addListener(`click`, function () {
					program.run(symbolRecord.onClick);
				});
				break;
			}
			return command.pc + 1;
		}
	},

	GMap: {

		compile: compiler => {
			compiler.compileVariable(`gmap`, `gmap`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	Marker: {

		compile: compiler => {
			compiler.compileVariable(`gmap`, `marker`);
			return true;
		},

		run: program => {
			return program[program.pc].pc + 1;
		}
	},

	On: {

		compile: compiler => {
			const lino = compiler.getLino();
			const action = AllSpeak_Language.reverseWord(compiler.nextToken());
			if ([`click`, `move`, `type`, `zoom`].includes(action)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.keyword === `gmap` || (symbolRecord.keyword === `marker` && action === `click`)) {
						compiler.next();
						compiler.addCommand({
							domain: `gmap`,
							keyword: `on`,
							lino,
							action,
							name: symbolRecord.name
						});
						return compiler.completeHandler();
					}
				}
			}
			return false;
		},

		run: (program) => {
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			switch (command.action) {
			case `click`:
				if (symbolRecord.keyword === `marker`) {
					symbolRecord.element.forEach(function (marker, index) {
						marker.targetRecord = symbolRecord;
						marker.targetIndex = index;
						marker.targetPc = command.pc + 2;
						marker.addListener(`click`, function () {
							if (program.length > 0) {
								marker.targetRecord.index = marker.targetIndex;
								setTimeout(function () {
									AllSpeak.timestamp = Date.now();
									program.run(marker.targetPc);
								}, 1);
							}
							return false;
						});
					});
				} else {
					symbolRecord.onClick = command.pc + 2;
				}
				break;
			case `move`:
				symbolRecord.onMove = command.pc + 2;
				break;
			case `type`:
				symbolRecord.onType = command.pc + 2;
				break;
			case `zoom`:
				symbolRecord.onZoom = command.pc + 2;
				break;
			default:
				program.runtimeError(command.lino, `Unknown action '${command.action}'`);
				return 0;
			}
			return command.pc + 1;
		}
	},

	Remove: {

		compile: compiler => {
			const lino = compiler.getLino();
			// remove marker <Symbol> from <Map>  (single, at current index)
			if (compiler.nextIsWord(`marker`)) {
				if (compiler.nextIsSymbol()) {
					const markerRecord = compiler.getSymbolRecord();
					if (markerRecord.keyword === `marker`) {
						if (compiler.nextIsWord(`from`)) {
							if (compiler.nextIsSymbol()) {
								const mapRecord = compiler.getSymbolRecord();
								if (mapRecord.keyword === `gmap`) {
									compiler.next();
									compiler.addCommand({
										domain: `gmap`,
										keyword: `remove`,
										lino,
										name: mapRecord.name,
										marker: markerRecord.name,
										all: false
									});
									return true;
								}
							}
						}
					}
				}
				return false;
			}
			// remove [all] markers from <Map>  (all)
			compiler.skipWord(`all`);
			if (compiler.nextTokenIs(`markers`)) {
				if (compiler.nextIsWord(`from`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `gmap`) {
							compiler.next();
							compiler.addCommand({
								domain: `gmap`,
								keyword: `remove`,
								lino,
								name: symbolRecord.name,
								all: true
							});
							return true;
						}
					}
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			if (command.all) {
				for (const marker of mapRecord.markers) {
					if (marker) marker.setMap(null);
				}
				mapRecord.markers = [];
			} else {
				const markerRecord = program.getSymbolRecord(command.marker);
				const idx = markerRecord.index;
				const m = markerRecord.element[idx];
				if (m) {
					m.setMap(null);
					const i = mapRecord.markers.indexOf(m);
					if (i >= 0) mapRecord.markers.splice(i, 1);
					markerRecord.element[idx] = undefined;
					if (markerRecord.id) markerRecord.id[idx] = undefined;
				}
			}
			return command.pc + 1;
		}
	},

	Set: {

		compile: compiler => {
			const lino = compiler.getLino();
			compiler.skipWord(`the`);
			const attribute = AllSpeak_Language.reverseWord(compiler.getToken());
			if ([`key`, `latitude`, `longitude`, `type`, `zoom`].includes(attribute)) {
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `gmap`) {
							if (compiler.nextIsWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `set`,
									lino,
									name: symbolRecord.name,
									attribute,
									value
								});
								return true;
							}
						}
					}
				}
			} else if ([`label`, `title`, `position`, `color`, `id`].includes(attribute)) {
				if (compiler.nextIsWord(`of`)) {
					if (compiler.nextIsSymbol()) {
						const symbolRecord = compiler.getSymbolRecord();
						if (symbolRecord.keyword === `marker`) {
							if (compiler.nextIsWord(`to`)) {
								const value = compiler.getNextValue();
								compiler.addCommand({
									domain: `gmap`,
									keyword: `set`,
									lino,
									name: symbolRecord.name,
									attribute,
									value
								});
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		run: program => {
			function pinSymbol(color) {
				return {
					path: `M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z`,
					fillColor: color,
					fillOpacity: 1,
					strokeColor: `#000`,
					strokeWeight: 2,
					scale: 1,
					labelOrigin: new google.maps.Point(0, -28)
				};
			}
			const command = program[program.pc];
			const symbolRecord = program.getSymbolRecord(command.name);
			if ([`key`, `latitude`, `longitude`, `type`, `zoom`].includes(command.attribute)) {
				symbolRecord[command.attribute] = program.getValue(command.value);
			} else if (command.attribute === `label`) {
				symbolRecord.label = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setLabel(symbolRecord.label);
			} else if (command.attribute === `title`) {
				symbolRecord.title = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setTitle(symbolRecord.title);
			} else if (command.attribute === `color`) {
				symbolRecord.color = program.getValue(command.value);
				const marker = symbolRecord.element[symbolRecord.index];
				marker.setIcon(pinSymbol(symbolRecord.color));
			} else if (command.attribute === `id`) {
				if (!symbolRecord.id) symbolRecord.id = [];
				symbolRecord.id[symbolRecord.index] = program.getValue(command.value);
			} else if (command.attribute === `position`) {
				const value = JSON.parse(program.getValue(command.value));
				symbolRecord.latitude = value.latitude;
				symbolRecord.longitude = value.longitude;
				const lat = parseFloat(value.latitude);
				const lng = parseFloat(value.longitude);
				symbolRecord.element[symbolRecord.index].setPosition(new google.maps.LatLng(lat, lng));
			}
			return command.pc + 1;
		}
	},

	Show: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				const type = symbolRecord.keyword;
				if (type === `gmap`) {
					compiler.next();
					compiler.addCommand({
						domain: `gmap`,
						keyword: `show`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			if (mapRecord.keyword !== `gmap`) {
				return 0;
			}
			const parentElement = mapRecord.parent.element[mapRecord.parent.index];
			if (typeof AllSpeak_GMap.loaded === `undefined`) {
				const script = document.createElement(`script`);
				script.src = `https://maps.googleapis.com/maps/api/js?key=${mapRecord.key}`;
				script.async = true;
				script.defer = true;
				script.onload = function () {
					AllSpeak_GMap.setupMap(parentElement, mapRecord, program);
					program.run(command.pc + 1);
					AllSpeak_GMap.loaded = true;
				};
				parentElement.insertBefore(script, null);
				return 0;
			}
			AllSpeak_GMap.setupMap(parentElement, mapRecord, program);
			return command.pc + 1;
		}
	},

	setupMap: (parentElement, mapRecord, program) => {
		const lat = parseFloat(mapRecord.latitude);
		const lng = parseFloat(mapRecord.longitude);
		const zoom = parseFloat(mapRecord.zoom);
		mapRecord.map = new google.maps.Map(parentElement, {
			center: {
				lat,
				lng
			},
			zoom,
			gestureHandling: `greedy`
		});
		mapRecord.map.markers = [];
		if (mapRecord.type === `hybrid`) {
			mapRecord.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
		}
		mapRecord.map.addListener(`center_changed`, function () {
			program.run(mapRecord.onMove);
		});
		mapRecord.map.addListener(`zoom_changed`, function () {
			program.run(mapRecord.onZoom);
		});
		mapRecord.map.addListener(`maptypeid_changed`, function () {
			program.run(mapRecord.onType);
		});
		mapRecord.map.addListener(`click`, function (event) {
			mapRecord.clickPosition = {
				latitude: event.latLng.lat().toString(),
				longitude: event.latLng.lng().toString()
			};
			program.run(mapRecord.onClick);
		});
	},

	Update: {

		compile: compiler => {
			const lino = compiler.getLino();
			if (compiler.nextIsSymbol()) {
				const symbolRecord = compiler.getSymbolRecord();
				if (symbolRecord.keyword === `gmap`) {
					compiler.next();
					compiler.addCommand({
						domain: `gmap`,
						keyword: `update`,
						lino,
						name: symbolRecord.name
					});
					return true;
				}
			}
			return false;
		},

		run: program => {
			const command = program[program.pc];
			const mapRecord = program.getSymbolRecord(command.name);
			mapRecord.map.setCenter(new google.maps.LatLng(mapRecord.latitude, mapRecord.longitude));
			mapRecord.map.setZoom(parseFloat(mapRecord.zoom));
			return command.pc + 1;
		}
	},

	getHandler: name => {
		switch (AllSpeak_Language.reverseWord(name)) {
		case `create`:
			return AllSpeak_GMap.Create;
		case `gmap`:
			return AllSpeak_GMap.GMap;
		case `marker`:
			return AllSpeak_GMap.Marker;
		case `on`:
			return AllSpeak_GMap.On;
		case `remove`:
			return AllSpeak_GMap.Remove;
		case `set`:
			return AllSpeak_GMap.Set;
		case `show`:
			return AllSpeak_GMap.Show;
		case `update`:
			return AllSpeak_GMap.Update;
		default:
			return null;
		}
	},

	run: program => {
		const command = program[program.pc];
		const handler = AllSpeak_GMap.getHandler(command.keyword);
		if (!handler) {
			program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'gmap' package`);
		}
		return handler.run(program);
	},

	value: {

		compile: compiler => {
			if (compiler.isWord(`the`)) {
				compiler.next();
			}
			const rawType = compiler.getToken();
			const type = AllSpeak_Language.reverseWord(rawType);
			if (type === `click`) {
				if (compiler.nextIsWord(`position`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const mapRecord = compiler.getSymbolRecord();
							if (mapRecord.keyword === `gmap`) {
								compiler.next();
								return {
									domain: `gmap`,
									type,
									name: mapRecord.name
								};
							}
						}
					}
				}
				return null;
			}
			// the <north|south|east|west> edge of <Map>
			if ([`north`, `south`, `east`, `west`].includes(type)) {
				if (compiler.nextIsWord(`edge`)) {
					if (compiler.nextIsWord(`of`)) {
						if (compiler.nextIsSymbol()) {
							const mapRecord = compiler.getSymbolRecord();
							if (mapRecord.keyword === `gmap`) {
								compiler.next();
								return {
									domain: `gmap`,
									type: `edge`,
									edge: type,
									name: mapRecord.name
								};
							}
						}
					}
				}
				return null;
			}
			if (compiler.nextIsWord(`of`)) {
				if (compiler.nextIsSymbol()) {
					const symbolRecord = compiler.getSymbolRecord();
					if (symbolRecord.keyword === `gmap` && [`latitude`, `longitude`, `type`, `zoom`, `bounds`, `edges`].includes(type) ||
            symbolRecord.keyword === `marker` && [`latitude`, `longitude`, `title`, `id`].includes(type)) {
						compiler.next();
						return {
							domain: `gmap`,
							type,
							name: symbolRecord.name
						};
					}
				}
			}
			return null;
		},

		get: (program, value) => {
			var symbolRecord;
			switch (value.type) {
			case `latitude`:
				symbolRecord = program.getSymbolRecord(value.name);
				switch (symbolRecord.keyword) {
				case `gmap`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).map.getCenter().lat().toString()
					};
				case `marker`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).marker.getPosition().lat().toString()
					};
				}
				break;
			case `longitude`:
				symbolRecord = program.getSymbolRecord(value.name);
				switch (symbolRecord.keyword) {
				case `gmap`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).map.getCenter().lng().toString()
					};
				case `marker`:
					return {
						type: `constant`,
						numeric: false,
						content: program.getSymbolRecord(value.name).marker.getPosition().lng().toString()
					};
				}
				break;
			case `type`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).map.getMapTypeId()
				};
			case `zoom`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).map.getZoom().toString()
				};
			case `bounds`:
				const map = program.getSymbolRecord(value.name).map;
				const bounds = map ? JSON.stringify(map.getBounds()) : ``;
				return {
					type: `constant`,
					numeric: false,
					content: bounds
				};
			case `edge`: {
				const m = program.getSymbolRecord(value.name).map;
				if (!m) {
					return { type: `constant`, numeric: false, content: `` };
				}
				const b = m.getBounds();
				let v;
				switch (value.edge) {
				case `north`: v = b.getNorthEast().lat(); break;
				case `south`: v = b.getSouthWest().lat(); break;
				case `east`:  v = b.getNorthEast().lng(); break;
				case `west`:  v = b.getSouthWest().lng(); break;
				}
				return { type: `constant`, numeric: false, content: v.toString() };
			}
			case `edges`: {
				const m = program.getSymbolRecord(value.name).map;
				if (!m) {
					return { type: `constant`, numeric: false, content: `{}` };
				}
				const b = m.getBounds();
				const obj = {
					north: b.getNorthEast().lat(),
					south: b.getSouthWest().lat(),
					east: b.getNorthEast().lng(),
					west: b.getSouthWest().lng()
				};
				return { type: `constant`, numeric: false, content: JSON.stringify(obj) };
			}
			case `id`: {
				const r = program.getSymbolRecord(value.name);
				return {
					type: `constant`,
					numeric: false,
					content: r.id ? (r.id[r.index] || ``) : ``
				};
			}
			case `title`:
				return {
					type: `constant`,
					numeric: false,
					content: program.getSymbolRecord(value.name).marker.getTitle()
				};
			case `click`:
				return {
					type: `constant`,
					numeric: false,
					content: JSON.stringify(program.getSymbolRecord(value.name).clickPosition)
				};
			}
			return null;
		}
	},

	condition: {

		compile: () => {},

		test: () => {}
	}
};

// eslint-disable-next-line no-unused-vars
AllSpeak.domain.gmap = AllSpeak_GMap;
