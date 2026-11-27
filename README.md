# Car Papers website

The public site for the Car Papers iPhone app: landing page, privacy policy and support page. Plain HTML, one stylesheet and one small script, served by GitHub Pages. No analytics, no cookies, no outside requests: fonts, images and the video are all served from this repository.

- `index.html`: the landing page.
- `privacy.html`: the privacy policy. The App Store listing and the app's Settings link to it, so keep its address.
- `support.html`: the support page. The App Store listing links to it.
- `apple.css`: everything visual, including every animation.
- `apple.js`: the scroll effects, the devices sequence, the sticky "How it works" phone, the highlights gallery and the film player. Nothing is sent anywhere.

## Design

The page follows the conventions of Apple's product pages (system font, white and light grey sections with one black section, centred headlines, a frosted bar at the top, pill buttons, footnotes) in Car Papers' own colours, with its own "Seal" logo and no Apple logos, artwork or slogans. Colours are the app's design tokens (`docs/BRIEF.md`, section 5, in the app's repository).

Type is the visitor's system font, so SF Pro on Apple devices. Elsewhere Instrument Sans stands in; it is under the SIL Open Font License, and the licence is next to the files in `assets/fonts/`.

## Motion

- **The setup** (`#ready`): five screens of the app's first run, drawn in HTML in the app's colours and type, pushed in one after another inside an iPhone, with the car name typed and each tap shown. It loops every 15 seconds and restarts with a crossfade.
- **The devices** (`#devices`): on wide screens the section stays pinned while you scroll. The iPhone turns to face you, the iPhone Duo arrives folded (showing its outer screen) and opens, and the Android preview turns in. On small screens each device plays as it scrolls into view. `apple.js` sets `--a`, `--d`, `--u` and `--b` from 0 to 1 on each figure and eases them towards the scroll position, so a mouse wheel's steps still look smooth; the CSS turns them into motion. The Duo is drawn flat in paint order (the lid always over the right half), which avoids 3D depth-sorting glitches where the two halves meet at the hinge.
- Headlines and cards rise in once as they arrive, the privacy statement lights up word by word, and the "How it works" phone follows the steps.

Looping animations pause while they are off screen. Without the script every section shows its finished state, and with Reduce Motion turned on nothing moves.

## Assets

- `assets/screens/`: real screens of the app in demo mode with the made-up sample documents (from `docs/screenshots/raw/` in the app's repository), at 450 and 900 pixels wide.
- `assets/gallery/`: the seven pictures in the highlights gallery, the same as the App Store screenshots.
- `assets/devices/`: the two halves of the iPhone Duo's inner screen (the home screen and a registration, cropped from screenshots of the app; the home screen also shows on the outer screen while it is folded), and three screens of the Android version in development. The status bars on the Duo and the Android phone are drawn on the page so they show 9:41 like the others.
- `assets/video/`: the 38-second film (`docs/video/car-papers-demo.mp4` in the app's repository) re-encoded to 720 × 1280 for the web, its poster frame, and captions of the voiceover. It downloads only when someone presses play.
- `assets/og-image.jpg`: the 1200 × 630 picture shown when the page is shared.
- `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: the app icon.

## Wording rules

- Never say "digital license", "digital ID", "official", "legal in all 50 states" or "never get a ticket", or suggest any tie to a DMV or a government. The license photo is always "a backup copy". Keep the "Good to know" paragraph.
- The app is free for now. Say "Free", but never that it will always be free.
- The Android version is only ever "in development" or a "preview": no store badge, no date.

## When the app is on the App Store

The page says "Coming soon to the App Store" in two places (search for `At launch`): under the phones at the top, and in the "Free" section. Replace each with Apple's official "Download on the App Store" badge, linked to https://apps.apple.com/app/id6838867229, and keep "Android version in development." next to the top one. Get the badge from Apple's marketing resources; don't redraw it.

If the app stops being free, change the "Free. No sign-in." line at the top, the "Free." point in the setup section, the "Free" section, the first question, the page and share descriptions, and the JSON-LD `price` in `index.html`. The film says it is free too, in its voiceover and its captions.

## Domain

The site is served at https://carpapers.org. GitHub Pages reads the domain from `CNAME`; GoDaddy holds the DNS (four A records and four AAAA records for `@` pointing at GitHub Pages, and a `www` CNAME to `javajaiden.github.io`). With the domain set, the old `javajaiden.github.io/car-papers/` addresses redirect to it, so links already in the App Store listing and the app keep working.
