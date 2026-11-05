# Photographs (`photo`)

The `photo` plugin gives a script the browser's own image pipeline: a photograph chosen by a person or fetched from a URL, made the right size, stripped of its metadata, shown on the page and saved to a file. It is the vocabulary a script needs the moment a user can attach a picture.

It is a **browser** plugin. The APIs behind it — `File`, `Blob`, `createImageBitmap`, canvas and object URLs — have no counterpart in the CLI runtime, so a script that uses `photo` runs in the browser and nowhere else.

## Loading it

Two files, and the core comes first:

```html
<script src="https://allspeak.ai/dist/allspeak.js"></script>
<script src="https://allspeak.ai/dist/plugins/photo-core.js"></script>
<script src="https://allspeak.ai/dist/plugins/photo.js"></script>
<script>AllSpeak_Startup();</script>
```

`photo-core.js` is the promise API over the browser's decoder, canvas and encoder; `photo.js` is the vocabulary. Loaded the other way round, the vocabulary has no core to call and the first `photo` command fails.

`idb` is needed only by `photo image … from blob` and `photo copy … into`, which meet it at the `idb blob` handle.

## The shape of a script

A photo is a **declared handle**, never a hidden "current photo". One script can hold an original, a display copy and a thumbnail at the same time, and every command names the one it acts on.

```as
photo image Original
photo image Large
photo image Thumb
```

A handle is **not a value**: it cannot be put into a variable, compared, or stored in JSON. Its bytes travel as a blob — out through `photo copy` into an `idb blob` handle, back in through `photo image … from blob`.

`photo image <P> from <source>` declares `P` on its first use, and so does every transform's `into` target, so a script does not have to declare the handles it only ever receives:

```as
photo image Original from file PhotoInput
photo resize Original to 1600 into Large      ! Large is declared here
photo thumbnail Original into Thumb           ! Thumb too
```

## Getting a photograph

| Command | Meaning |
|---|---|
| `photo image <P> from file <F>` | The first file from a `file` input |
| `photo image <P> from url <U>` | Fetch a URL and decode it |
| `photo image <P> from blob <B>` | Read an `idb blob` handle |
| `photo image <P> from canvas <C>` | Encode a canvas as PNG |
| `photo clear <F>` | Empty a file input so the same file can be chosen again |

The four `from …` commands are fail-capable. A cancelled picker is an ordinary failure, so give it a clause:

```as
file PhotoInput
photo image Photo from file PhotoInput or gosub NoPhoto
```

The input's attributes belong to the browser domain:

```as
set attribute `accept` of PhotoInput to `image/*`
set attribute `capture` of PhotoInput to `environment`   ! the rear camera, on a phone
```

`capture` is a request, not a guarantee: a desktop ignores it, and a phone still offers the photo library under `image/*`.

- **The input is not cleared by reading it.** Choosing the same file again fires no `change` event, so call `photo clear PhotoInput` when the flow needs a second read.
- **A `from url` fetch is a normal `GET`.** A picture an `<img>` can display may still be unreadable here: cross-origin URLs need CORS headers, because reading the bytes is what makes resizing and EXIF stripping possible. A non-2xx response fails with `NetworkError` and the status.
- **A canvas is the escape hatch.** Draw what you like on it, then `photo image Photo from canvas Canvas`. Crop and annotation stay out of the plugin.

## Changing a photograph

Every transform writes a handle named by `into`, and the source is never modified — unless the target *is* the source, which replaces the bytes and revokes the old object URL.

| Command | Meaning |
|---|---|
| `photo resize <P> to <N> into <Q>` | Longest edge `N`, aspect ratio kept |
| `photo thumbnail <P> into <Q>` | Longest edge 320 |
| `photo encode <P> [as <format>] [quality <N>] into <Q>` | Rewrite the bytes as JPEG, PNG or WebP |

All three are fail-capable.

**A resize never upscales.** If the longest edge is already `N` or less, `Q` receives the **same bytes**: no decode, no re-encode, no metadata loss. Upscaling adds bytes and no detail, and a phone should not do it because a script asked for a bigger number. The 320 and 70 of a thumbnail are part of the vocabulary rather than settings; a script that wants other numbers uses `resize` and `encode`.

`photo encode` **always rewrites the bytes**, which is what makes it the command that strips EXIF and GPS. Formats are the words `jpeg`, `png` and `webp`; without `as` the source's MIME type is kept, and an image with no MIME type at all fails with `TypeError` until the format is named. Quality is 0–100 and defaults to 75; JPEG and WebP use it, PNG ignores it.

**Encoding to JPEG paints transparency onto white.** Canvas transparency otherwise becomes black, which is what a transparent logo would look like. PNG and WebP keep the alpha channel.

## What happens to the metadata

| Path | EXIF / GPS |
|---|---|
| `from file`, `from url`, `from blob`, `from canvas` | Kept as the source gave them |
| `resize` / `thumbnail`, image already small enough | **Kept** — the bytes were not touched |
| `resize` / `thumbnail`, image actually shrunk | Removed |
| `encode` | Always removed |
| `save`, `copy` | Whatever the handle holds |

A no-op resize keeps the location data, so a script that must not leak it calls `photo encode` before storing or saving, **even when the picture is already the right size**. Canvas re-encoding also converts the colour space (sRGB in practice) and drops the ICC profile: a canvas carries pixels and nothing else.

Sherpa's rule — resize to 1600, JPEG 75, strip EXIF — is two lines, and the second is not redundant:

```as
photo resize Original to 1600 into Large
photo encode Large as jpeg quality 75 into Clean
```

## Showing, saving and releasing

```as
put the blob url of Thumb into ThumbUrl
set attribute `src` of Preview to ThumbUrl
```

`the blob url of P` makes an object URL on first use and caches it on the handle. Replacing the handle's bytes revokes it; `photo release` revokes it explicitly. An object URL pins its blob in memory until it is revoked, so release the originals once the copies exist, and every handle when its screen closes.

```as
photo save Large to `route-42-front-grille.jpg`
```

`save` downloads the image under the name it is given — use an extension that matches the blob's type, because the plugin does not add one. It uses an anchor with the `download` attribute and a fresh object URL, which is revoked after the click; the display URL is untouched. **Call it from the click handler that asked for the save, with the image already loaded**: after an awaited capture or transform the user gesture may be gone, and the browser can block the download.

```as
photo release Original
```

`release` revokes the URL, drops the blob and resets the dimensions. Releasing twice, or releasing an empty handle, is a no-op.

## Working with `idb`

The two plugins meet at the `idb blob` handle, and neither has to know how the other is implemented:

```as
idb blob Bytes
photo copy Large into Bytes
idb put Bytes into `photos` of DB with key PhotoKey

idb blob Stored
idb get Stored from `photos` of DB with key PhotoKey
photo image Shown from blob Stored
```

`photo copy` copies the blob reference and nothing else — no encoding, no object URL — so the bytes `idb put` stores are exactly the bytes the handle held.

## Values and conditions

| Expression | Result |
|---|---|
| `the pixel width of P` | Width in pixels, after EXIF orientation |
| `the pixel height of P` | Height in pixels, after EXIF orientation |
| `the byte size of P` | Encoded size in bytes |
| `the mime type of P` | MIME type, possibly empty |
| `the blob url of P` | Object URL, made on first use and cached |

The `pixel` qualifier keeps these clear of `the width of <element>`, which is the browser's layout measurement. Reading any of them from an empty handle fails with `InvalidStateError`. All five are synchronous: the dimensions are recorded when the image is decoded, never guessed from a file name or an EXIF field.

`P is loaded` is true when the handle holds a blob; negate it with `not`:

```as
if Photo is not loaded print `No photo yet.`
```

There is no `P is decoding`: commands do not return until the work is done, so a half-loaded handle never reaches script code.

## Failures

Everything that reads a file, fetches, decodes or encodes is fail-capable, with the runtime's own `or` and `on failure` clauses.

```as
photo image Photo from url `https://example.com/route.jpg`
    on failure print `Could not load the picture: ` cat the error
```

`the error` begins with the operation and the DOMException's name:

```
photo decode failed: EncodingError: The source image could not be decoded.
```

| Name | Cause |
|---|---|
| `NotFoundError` | The file input has no file chosen |
| `NetworkError` | The fetch failed, or returned a non-2xx status |
| `EncodingError` | The bytes are not an image the browser can decode |
| `SecurityError` | A tainted canvas, or another browser security restriction |
| `InvalidStateError` | A handle that holds no bytes was used |
| `NotSupportedError` | The requested output format cannot be encoded |
| `TypeError` | The source has no MIME type and no `as` format was given |
| `RangeError` | A size below 1, or a quality outside 0–100 |

`photo save`, `photo copy`, `photo release` and `photo clear` are **not** fail-capable: saving or copying an empty handle is a script bug, and it stops the thread with `InvalidStateError`.

## A worked example

`DB` and the `photos` store are assumed to be open — see [IndexedDB](indexeddb.md).

```as
!! Declare the elements, the handles and the working variables once, at the top.
!!
!! Variables are global in AllSpeak, so a declaration inside the handler would be a second declaration on the second run of the handler.

    file PhotoInput
    image Preview
    photo image Original
    photo image Large
    photo image Thumb
    idb blob Bytes
    idb database DB
    idb schema Sherpa version 1
    idb store `photos` in Sherpa without key
    variable PhotoKey
    variable ThumbUrl
!!!

!! Ask the phone for the rear camera, and take the first file the picker returns.
!!
!! `capture` is only a hint: a desktop shows a file chooser, and a phone may still offer the library.

    set attribute `accept` of PhotoInput to `image/*`
    set attribute `capture` of PhotoInput to `environment`
    on change PhotoInput gosub PhotoChosen
!!!

!! Decode the chosen file and keep three sizes: the original, a 1600 px copy, and a thumbnail.
!!
!! The original is released as soon as the copies exist; the large copy is what gets stored.

PhotoChosen:
    photo image Original from file PhotoInput or gosub NoPhoto
    photo resize Original to 1600 into Large
    photo encode Large as jpeg quality 75 into Clean
    photo thumbnail Original into Thumb
    photo release Original
!!!

!! Store the bytes, then show the thumbnail. `copy` is the bridge into `idb`.

    put `front-grille` into PhotoKey
    photo copy Clean into Bytes
    idb put Bytes into `photos` of DB with key PhotoKey
        on failure print `Could not store the photo: ` cat the error

    put the blob url of Thumb into ThumbUrl
    set attribute `src` of Preview to ThumbUrl
    photo clear PhotoInput
    stop
!!!

!! A cancelled picker is an ordinary failure, not a crash.

NoPhoto:
    print `No photo chosen.`
!!!
```

## Related

- [Plugins](plugins.md) — the contract, and which plugins have a page.
- [IndexedDB](indexeddb.md) — where the bytes go when they are stored.
- [Browser and Webson](browser-and-webson.md) — the element types, `set attribute` and `on change`.
- [Errors and recovery](errors-and-recovery.md) — `or` against `on failure`.
