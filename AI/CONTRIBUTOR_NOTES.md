# Contributor Notes

- The shared language contract and the conformance baseline live under `spec/` and `conformance/`.
- The canonical test set is `conformance/tests/EC-0001` … `EC-0015`, with JSON expectations and a manifest at `conformance/tests/index.json`. Prefer extending that set before changing runtime behaviour across implementations.
- `spec/allspeak-plugin-contract.md` is the plugin interface both runtimes follow.
- The Python language packs are generated from the JS ones: edit `js/allspeak/LanguagePack_<lang>.js`, then run `./sync-language-packs`. Do not hand-edit `allspeak-py/allspeak/languages/*.json`.
- `RELEASE_NOTES.md` is repo-specific and is not part of any mirror.

Earlier notes in this file pointed at `scripts/allspeak/sync-shared-to-py.sh` and `scripts/allspeak/publish-shared-to-py.sh` for mirroring `spec/` and `conformance/` into a sibling `allspeak-py` checkout. Neither script exists in this repo any more; `./sync-language-packs` is the mirroring tool that remains.
