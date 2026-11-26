# Car Papers website

The public site for the Car Papers iPhone app: landing page, privacy policy and support page. Plain HTML and CSS with one small inline script, served by GitHub Pages. No analytics, no cookies, no outside requests: fonts, images and the video are all served from this repository.

- `index.html`: the landing page.
- `privacy.html`: the privacy policy. The App Store listing and the app's Settings link to it, so keep its address.
- `support.html`: the support page. The App Store listing links to it.
- `styles.css`: everything visual, including every animation.

## Brand

Colours, corner radii and shadows are the app's own design tokens (`docs/BRIEF.md`, section 5, in the app's repository). The logo is "Seal", drawn as inline SVG from the app's `Shared/Drawing/LogoArtwork.swift`. The large folder at the top of the page is that logo with three papers in it.

Type:

- Bricolage Grotesque Bold for headlines,
- Instrument Sans for text,
- Geist Mono for small labels,
- the iPhone's own system font inside the drawings of app screens, so they read like the app on an iPhone.

The three fonts are under the SIL Open Font License; the licences are next to the files in `assets/fonts/`.

## Motion

Each graphic animates when it scrolls into view, and again the next time. The script only adds the starting states, so without it every graphic simply shows its finished state, and with Reduce Motion turned on nothing moves.

## Assets

- `assets/screens/`: real screens of the app in demo mode with the made-up sample documents (from `docs/screenshots/raw/` in the app's repository), at 450 and 900 pixels wide.
- `assets/video/`: the 32-second tour (`docs/video/car-papers-demo.mp4` in the app's repository) re-encoded to 720 × 1280 for the web, its poster frame, and captions of the voiceover. It downloads only when someone presses play.
- `assets/og-image.jpg`: the 1200 × 630 picture shown when the page is shared.
- `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: the app icon.

## Wording rules

Never say "digital license", "digital ID", "official", "legal in all 50 states" or "never get a ticket", or suggest any tie to a DMV or a government. The license photo is always "a backup copy". Keep the "Good to know" paragraph.

## When the app is on the App Store

The page says "Coming soon to the App Store" in two places (search for `At launch`). Replace each with Apple's official "Download on the App Store" badge, linked to https://apps.apple.com/app/id6838867229. Get the badge from Apple's marketing resources; don't redraw it.

If the app stops being free, change the "Free" section, the receipt, the first question, the JSON-LD `price` and the share text in `index.html`.

## Domain

The site is meant to be served at https://carpapers.org. GitHub Pages reads the domain from `CNAME`; GoDaddy holds the DNS (four A records for `@` pointing at GitHub Pages, and a `www` CNAME to `javajaiden.github.io`). With the domain set, the old `javajaiden.github.io/car-papers/` addresses redirect to it, so links already in the App Store listing and the app keep working.
