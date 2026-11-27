// Car Papers: the film. Renders film.html frame by frame in headless Chrome, lays the voiceover and a
// music bed made from Apple Loops under it, and writes the 1080 × 1920 master, the 720 × 1280 web copy
// and the poster.
//
//   node _film/build.mjs [--app <app repo>] [--work <scratch dir>] [--only clips,frames,audio,encode]
//   node _film/build.mjs --preview 0.5,6.6,9.4   (renders just those moments to <work>/preview/)
//
// Needs ffmpeg, Google Chrome, cwebp, and the app repository's docs/video (raw recordings, stills and
// voiceover.mp3). Nothing here is published: Jekyll skips folders whose names start with "_".
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'yes']] : acc), []));
const APP = args.app || '/Users/jaiden/Library/Bitrig/Users/24550/Projects/62599025-9ede-43d8-a26f-5f11085111b2';
const WORK = resolve(args.work || join(tmpdir(), 'car-papers-film'));
const ONLY = args.only ? args.only.split(',') : ['clips', 'frames', 'audio', 'encode'];
const FPS = 30, END = 38.0, FRAMES = Math.round(END * FPS);
const RAW = join(APP, 'docs/video/raw'), STILLS = join(APP, 'docs/video/stills'), VOICE = join(APP, 'docs/video/voiceover.mp3');
const LOOPS = '/Library/Audio/Apple Loops/Apple/07 Chillwave';

// Where each recording starts in its raw file, when it appears on the timeline, and for how long it is needed.
const clips = { home: [3.15, 4.90, 3.9], check: [3.60, 13.45, 5.3], show: [3.60, 18.15, 4.1], remind: [6.75, 26.35, 4.4] };
// The voiceover, cut in its pauses: (from, to) in voiceover.mp3 and where each piece lands (as in the app's scripts/video/build.py).
const speech = [
  [0.00, 4.48, 0.35], [4.48, 6.90, 5.10], [6.90, 11.92, 8.25], [11.92, 14.50, 13.60], [14.50, 16.83, 18.30],
  [16.83, 20.12, 21.90], [20.12, 22.82, 26.50], [22.82, 25.21, 30.45], [25.21, 28.24, 33.80],
];
// The music: four Apple Loops from one Chillwave set (E major, 100 BPM, so 16 bars is 38.4 seconds). Every stem
// runs from 0:00 so their bars line up; these windows open and close them. [on, off, fade in, fade out]
const BAR = 2.4;
const stems = {
  synth: { file: 'Chill Melody Synth 01.caf', gain: 0, windows: [[0, END, 1.2, 1.4]] },
  chords: { file: 'Chill Melody Guitar Chords.caf', gain: 0, windows: [[2 * BAR, 30.35, 0.06, 0.35], [14 * BAR, END, 0.05, 1.4]] },
  bass: { file: 'Chill Melody Bass 02.caf', gain: 0, windows: [[3 * BAR, 30.35, 0.05, 0.3], [14 * BAR, END, 0.05, 1.4]] },
  beat: { file: 'Pastel Colors Beat 01.caf', gain: 0, windows: [[3 * BAR, 30.35, 0.03, 0.2], [14 * BAR, END, 0.03, 1.4]] },
};

function run(cmd, list, opts = {}) {
  const r = spawnSync(cmd, list, { encoding: 'utf8', maxBuffer: 1 << 26, ...opts });
  if (r.status !== 0) { console.error((r.stderr || '').slice(-2000)); throw new Error(`${cmd} failed`); }
  return (r.stderr || '') + (r.stdout || '');
}
const ff = (list) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...list]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const countFrames = (name) => readdirSync(join(WORK, 'clips', name)).filter((f) => f.endsWith('.jpg')).length;

// 1. The recordings as 30 fps frames, and the stills, sized for the phone in the film.
function makeClips() {
  for (const [name, [start, , length]] of Object.entries(clips)) {
    const dir = join(WORK, 'clips', name);
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    ff(['-ss', String(start), '-i', join(RAW, `${name}.mp4`), '-t', String(length), '-vf', 'fps=30,scale=600:-2:flags=lanczos', '-q:v', '2', join(dir, '%04d.jpg')]);
  }
  mkdirSync(join(WORK, 'stills'), { recursive: true });
  for (const name of ['widgets', 'lock']) ff(['-i', join(STILLS, `${name}.png`), '-vf', 'scale=600:-2:flags=lanczos', '-q:v', '2', join(WORK, 'stills', `${name}.jpg`)]);
  console.log('clips:', Object.keys(clips).map((n) => `${n} ${countFrames(n)}`).join(', '));
}

// 2. Headless Chrome, driven over the DevTools protocol: seek, wait for the pictures, capture.
async function withPage(fn) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = join(WORK, `chrome-${port}`);
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--allow-file-access-from-files', '--force-color-profile=srgb', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {} await sleep(150); }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = [];
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) events.push(m); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(join(here, 'film.html')).href });
  for (let i = 0; i < 100 && !events.find((e) => e.method === 'Page.loadEventFired'); i++) await sleep(100);
  await sleep(400);
  const counts = Object.fromEntries(Object.keys(clips).map((n) => [n, countFrames(n)]));
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  await evaluate(`document.fonts.ready.then(() => { setupFilm(${JSON.stringify(pathToFileURL(WORK).href)}, ${JSON.stringify(counts)}); return true; })`);
  try { await fn({ send, evaluate }); } finally {
    const errors = events.filter((e) => e.method === 'Runtime.exceptionThrown');
    if (errors.length) console.log('page errors:', JSON.stringify(errors[0].params.exceptionDetails).slice(0, 300));
    ws.close(); chrome.kill(); await sleep(300); rmSync(profile, { recursive: true, force: true });
  }
}
async function capture(send, file, format = 'jpeg') {
  const s = await send('Page.captureScreenshot', format === 'png' ? { format: 'png' } : { format: 'jpeg', quality: 94 });
  writeFileSync(file, Buffer.from(s.result.data, 'base64'));
}
async function renderFrames() {
  const dir = join(WORK, 'frames');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const started = Date.now();
  await withPage(async ({ send, evaluate }) => {
    for (let f = 0; f < FRAMES; f++) {
      await evaluate(`seek(${(f / FPS).toFixed(5)})`);
      await capture(send, join(dir, `f${String(f).padStart(5, '0')}.jpg`));
      if (f % 150 === 0) console.log(`frame ${f}/${FRAMES} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    }
  });
  console.log(`frames: ${FRAMES} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}
async function preview(times) {
  const dir = join(WORK, 'preview'); mkdirSync(dir, { recursive: true });
  await withPage(async ({ send, evaluate }) => {
    for (const t of times) { await evaluate(`seek(${t})`); await capture(send, join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`), 'png'); }
  });
  console.log('preview:', dir);
}

// 3. Sound: the voiceover pieces where they belong, and the music ducked under them.
function loudness(file) {
  const out = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const i = out.match(/I:\s+(-?[\d.]+) LUFS/g); const tp = out.match(/Peak:\s+(-?[\d.]+) dBFS/g);
  return { I: i ? parseFloat(i[i.length - 1].split(':')[1]) : null, TP: tp ? parseFloat(tp[tp.length - 1].split(':')[1]) : null };
}
function makeAudio() {
  const dir = join(WORK, 'audio'); mkdirSync(dir, { recursive: true });
  // Voice: each piece at its place, then to -16 LUFS.
  const pieces = speech.map(([from, to, at], i) => `[0:a]atrim=start=${from}:end=${to},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(to - from - 0.04).toFixed(3)}:d=0.04,adelay=${Math.round(at * 1000)}:all=1[s${i}]`);
  ff(['-i', VOICE, '-filter_complex', `${pieces.join(';')};${speech.map((_, i) => `[s${i}]`).join('')}amix=inputs=${speech.length}:normalize=0,aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,apad=whole_dur=${END},atrim=end=${END}[v]`, '-map', '[v]', '-ar', '48000', '-c:a', 'pcm_s16le', join(dir, 'voice.wav')]);
  // Music: each stem decoded, tiled from 0:00, measured, set to the same loudness, then windowed.
  const parts = [];
  for (const [name, stem] of Object.entries(stems)) {
    const loop = join(dir, `${name}-loop.wav`);
    ff(['-i', join(LOOPS, stem.file), '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', loop]);
    const tiled = join(dir, `${name}-tiled.wav`);
    ff(['-stream_loop', '-1', '-i', loop, '-t', String(END), '-c:a', 'pcm_s16le', tiled]);
    const L = loudness(tiled);
    const target = { synth: -25, chords: -27, bass: -27, beat: -25.5 }[name];
    const gain = (target - L.I + stem.gain).toFixed(2);
    const env = stem.windows.map(([on, off, fi, fo]) => `clip((t-${on})/${fi},0,1)*clip((${off}-t)/${fo},0,1)`).join('+');
    parts.push({ name, tiled, filter: `volume=${gain}dB,volume='${env}':eval=frame` });
    console.log(`music ${name}: ${L.I} LUFS -> ${target} (${gain} dB)`);
  }
  ff([...parts.flatMap((p) => ['-i', p.tiled]), '-filter_complex', `${parts.map((p, i) => `[${i}:a]${p.filter}[m${i}]`).join(';')};${parts.map((_, i) => `[m${i}]`).join('')}amix=inputs=${parts.length}:normalize=0[m]`, '-map', '[m]', '-c:a', 'pcm_s16le', join(dir, 'music.wav')]);
  // Duck the music under the voice, mix, and keep the peaks under -1.5 dBTP.
  ff(['-i', join(dir, 'music.wav'), '-i', join(dir, 'voice.wav'), '-filter_complex',
    `[1:a]apad=whole_dur=${END},atrim=end=${END},asplit=2[vk][vm];[0:a][vk]sidechaincompress=threshold=0.02:ratio=5:attack=12:release=420:makeup=1[duck];[duck][vm]amix=inputs=2:normalize=0,alimiter=limit=0.84:attack=3:release=60:level=false,apad=whole_dur=${END},atrim=end=${END}[mix]`,
    '-map', '[mix]', '-c:a', 'pcm_s16le', join(dir, 'mix.wav')]);
  for (const f of ['voice', 'music', 'mix']) { const L = loudness(join(dir, `${f}.wav`)); console.log(`${f}: ${L.I} LUFS, peak ${L.TP} dBFS`); }
}

// 4. The master, the web copy (replacing the site's film), and the poster.
function encode() {
  const master = join(WORK, 'car-papers-film-1080x1920.mp4');
  ff(['-framerate', String(FPS), '-i', join(WORK, 'frames', 'f%05d.jpg'), '-i', join(WORK, 'audio', 'mix.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', master]);
  const web = join(site, 'assets/video/car-papers-demo.mp4');
  ff(['-i', master, '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', web]);
  const poster = join(WORK, 'poster.png');
  ff(['-ss', '37.4', '-i', master, '-frames:v', '1', '-vf', 'scale=720:1280:flags=lanczos', poster]);
  run('cwebp', ['-quiet', '-q', '82', poster, '-o', join(site, 'assets/video/demo-poster.webp')]);
  console.log('master:', master); console.log('web:', web);
}

mkdirSync(WORK, { recursive: true });
if (args.preview) {
  if (!existsSync(join(WORK, 'clips', 'home'))) makeClips();
  await preview(args.preview.split(',').map(Number));
} else {
  if (ONLY.includes('clips')) makeClips();
  if (ONLY.includes('frames')) await renderFrames();
  if (ONLY.includes('audio')) makeAudio();
  if (ONLY.includes('encode')) encode();
}
