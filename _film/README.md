# The film

`assets/video/car-papers-demo.mp4` (38 seconds, 720 × 1280 for the web) is this website, played as an ad. It keeps the app's checked voiceover and its timing, so `assets/video/car-papers-demo.vtt` still fits, and puts the site's own type, phone frames, promises and devices around it.

Nothing in this folder is published: GitHub Pages runs Jekyll, which skips folders whose names start with `_`.

| From | On screen | Spoken |
| --- | --- | --- |
| 0:00 | "Your registration." "Your insurance card." "Where are they when you need them?" | the same |
| 0:05 | The app icon, "Car Papers", and the three phones from the top of the site (the middle one plays the real app opening to Home) | Car Papers keeps both on your iPhone. |
| 0:08 | Free. No sign-in. Easy setup. Works as soon as you download it. (one at a time, with the site's icons) | It's free. There's no sign-in. Setup is easy, and it works as soon as you download it. |
| 0:13 | One phone, four headlines: Take a photo, Show them in one tap, Right on your Home Screen (and the Lock Screen), A reminder in time | the matching lines |
| 0:30 | Black: the lock badge, "No account.", "Nothing leaves your iPhone." lit word by word | No account. Nothing leaves your phone. |
| 0:33 | The app icon, "Car Papers", "Free. No sign-in.", the iPhone turning in and the iPhone Duo opening from its folded widget screen, "Ready when you need them." | Car Papers. Free, and ready when you need them. |

## Sound

- **Voice:** `docs/video/voiceover.mp3` from the app's repository (ElevenLabs, checked word for word against the script), cut in its pauses and placed exactly as the app's `scripts/video/build.py` places it, at -16 LUFS.
- **Music:** four Apple Loops from one Chillwave set in E major at 100 BPM (Chill Melody Synth 01, Chill Melody Guitar Chords, Chill Melody Bass 02, Pastel Colors Beat 01). 16 bars at that tempo is 38.4 seconds. Apple Loops are royalty-free for soundtracks in your own videos; they may not be shared on their own. The beat and bass drop out for the privacy moment and come back for the end. The music ducks under the voice.

## Making it again

Needs Google Chrome, ffmpeg, cwebp, Node 22 and the app repository's `docs/video` folder (its `raw/` recordings are not in git).

```
node _film/build.mjs --work "$TMPDIR/car-papers-film"
```

That extracts the recordings' frames, renders all 1,140 frames of `film.html` in headless Chrome (about a minute), mixes the sound, writes a 1080 × 1920 master into the work folder, and replaces `assets/video/car-papers-demo.mp4` and `demo-poster.webp`. `--preview 0.5,9.6,35.4` renders just those moments; `film.html?t=12.5` in a browser shows one moment without the recordings.

Every moving value in `film.js` is a function of the time, so a frame always comes out the same. The devices at the end are the site's own (`apple.css`), so a change to them shows up in the film the next time it is made.

**If the app gets a price**, the film must change: it says "free" on screen and in the voiceover.
