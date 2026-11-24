// MIDI Creator: algorithmic generators. Each method makes events on a step grid; the renderer
// turns them into notes in the key, following the progression. No LUNA here.
//
// An event is { at, len, deg } (a degree of the key's scale, 0 = tonic, may be negative or above 6),
// or { at, len, ct } (a chord tone: 0 = root, 1 = next tone up…), or { at, len, pitch }, plus an
// optional vel. `at` and `len` count grid steps from the start of the span.

(function (root) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];
  const PHI = (1 + Math.sqrt(5)) / 2;

  // ---- Number sources -----------------------------------------------------------------------------
  // Digits worked out here with big integers, so they are right without a table.
  function piDigits(n) {
    // Machin: pi = 16 atan(1/5) - 4 atan(1/239), in fixed point with guard digits.
    const scale = 10n ** BigInt(n + 10);
    const atan = (x) => { let sum = 0n, term = scale / x, k = 1n, sign = 1n; const x2 = x * x; while (term) { sum += sign * (term / k); term /= x2; k += 2n; sign = -sign; } return sum; };
    const pi = 16n * atan(5n) - 4n * atan(239n);
    return pi.toString().slice(0, n + 1).split('').map(Number);
  }
  function eDigits(n) {
    const scale = 10n ** BigInt(n + 10);
    let sum = 0n, term = scale, k = 1n;
    while (term) { sum += term; term /= k; k++; }
    return sum.toString().slice(0, n + 1).split('').map(Number);
  }
  function phiDigits(n) {
    const scale = 10n ** BigInt(2 * (n + 10));
    const isqrt = (v) => { let x = BigInt(Math.floor(Math.sqrt(Number(v)))) || 1n; for (let i = 0; i < 200; i++) { const y = (x + v / x) / 2n; if (y >= x - 1n && y <= x + 1n) { x = y; break; } x = y; } while (x * x > v) x--; while ((x + 1n) * (x + 1n) <= v) x++; return x; };
    const root5 = isqrt(5n * scale);
    const phi = (10n ** BigInt(n + 10) + root5) / 2n;
    return phi.toString().slice(0, n + 1).split('').map(Number);
  }
  const fibs = (n) => { const f = [1, 1]; while (f.length < n) f.push(f[f.length - 1] + f[f.length - 2]); return f.slice(0, n); };
  const primes = (n) => { const p = []; for (let k = 2; p.length < n; k++) if (p.every((q) => k % q)) p.push(k); return p; };

  // ---- The methods --------------------------------------------------------------------------------
  const M = {};

  // Fibonacci durations: notes 1, 1, 2, 3, 5, 8… steps long, climbing the chord, then starting over.
  M.fibDur = (n, o, r) => {
    const seq = fibs(clamp(o.terms ?? 6, 3, 8));
    const ev = [];
    let at = 0, i = 0;
    while (at < n) { const len = seq[i % seq.length]; ev.push({ at, len, [o.pitchSrc === 'scale' ? 'deg' : 'ct']: i % seq.length }); at += len; i++; }
    return ev;
  };
  // Fibonacci modulo 7 as degrees of the scale: the remainders repeat every 16 numbers (the Pisano
  // period of 7), so it is a 16-step melody that loops by itself.
  M.fibMod = (n, o) => {
    const ev = [];
    let a = 0, b = 1;
    for (let k = 0; k < (o.offset ?? 0); k++) [a, b] = [b, (a + b) % 7];
    for (let at = 0; at < n; at++) { ev.push({ at, len: 1, deg: a, vel: at % 4 === 0 ? 10 : 0 }); [a, b] = [b, (a + b) % 7]; }
    return ev;
  };
  // The Fibonacci word 1011010110110…: a rhythm that almost repeats and never quite does.
  M.fibWord = (n, o) => {
    const ev = [];
    let hit = 0;
    for (let at = 0; at < n; at++) {
      const bit = Math.floor((at + 2) / PHI) - Math.floor((at + 1) / PHI);
      if (bit) { const zig = [0, 1, 2, 3, 4, 3, 2, 1][hit % 8]; ev.push({ at, len: 1, [o.pitchSrc === 'scale' ? 'deg' : 'ct']: o.pitchSrc === 'root' ? 0 : zig }); hit++; }
    }
    return ev;
  };
  // An elementary cellular automaton: one generation per bar, live cells are hits; the column
  // picks the chord tone or scale degree.
  M.cellular = (n, o, r, bars) => {
    const w = clamp(o.cells ?? 16, 4, 32);
    const rule = clamp(o.rule ?? 90, 0, 255);
    let row = Array.from({ length: w }, (_, i) => (o.start === 'random' ? r() < 0.4 : i === Math.floor(w / 2)));
    const ev = [];
    for (let at = 0, gen = 0; at < n; at += w, gen++) {
      row.forEach((on, i) => { if (on && at + i < n) ev.push({ at: at + i, len: 1, [o.pitchSrc === 'scale' ? 'deg' : 'ct']: o.pitchSrc === 'scale' ? (i % 8) : i % 4 }); });
      row = row.map((_, i) => { const l = row[(i - 1 + w) % w] ? 4 : 0, c = row[i] ? 2 : 0, rr = row[(i + 1) % w] ? 1 : 0; return !!((rule >> (l + c + rr)) & 1); });
      if (!row.some(Boolean)) row[Math.floor(w / 2)] = true;
    }
    return ev;
  };
  // L-systems: a word rewritten again and again, read as moves of a melody.
  const LSYS = {
    fibonacci: { axiom: 'A', rules: { A: 'AB', B: 'A' }, read: { A: [1, 'note'], B: [-2, 'note'] } },
    cantor: { axiom: 'A', rules: { A: 'ABA', B: 'BBB' }, read: { A: [0, 'note'], B: [0, 'rest'] } },
    koch: { axiom: 'F', rules: { F: 'F+F-F-F+F' }, read: { F: [0, 'note'], '+': [1, 'move'], '-': [-1, 'move'] } },
    dragon: { axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, read: { F: [0, 'note'], '+': [2, 'move'], '-': [-2, 'move'] } },
  };
  M.lsystem = (n, o) => {
    const L = LSYS[o.lsys] ?? LSYS.fibonacci;
    let w = L.axiom;
    for (let i = 0; i < clamp(o.iter ?? 7, 1, 9) && w.length < 4000; i++) w = [...w].map((c) => L.rules[c] ?? c).join('');
    const ev = [];
    let deg = 0, at = 0;
    for (const c of w) {
      if (at >= n) break;
      const rd = L.read[c];
      if (!rd) continue;
      const [move, kind] = rd;
      if (kind === 'move') { deg = clamp(deg + move, -7, 14); continue; }
      if (kind === 'note') { deg = clamp(deg + move, -7, 14); ev.push({ at, len: 1, deg }); }
      at++;
    }
    return ev;
  };
  // The logistic map x -> r·x·(1-x): order, then period doubling, then chaos as r goes up.
  M.logistic = (n, o, r) => {
    const rr = clamp((o.r ?? 370) / 100, 2.5, 4);
    let x = 0.2 + r() * 0.6;
    for (let i = 0; i < 64; i++) x = rr * x * (1 - x);
    const ev = [];
    const rest = clamp(o.rests ?? 0, 0, 90) / 100;
    for (let at = 0; at < n; at++) {
      x = rr * x * (1 - x);
      if (x < rest) continue;
      ev.push({ at, len: 1, deg: Math.round(x * 10) - 2 });
    }
    return ev;
  };
  // Steve Reich's phasing: two voices play the same pattern; the second moves one step later
  // every few bars until they meet again.
  const PATTERNS = {
    clapping: [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
    bembe: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
    son: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
    tresillo: [1, 0, 0, 1, 0, 0, 1, 0],
  };
  M.phasing = (n, o, r, bars, stepTicks, TPB) => {
    const pat = PATTERNS[o.pattern] ?? PATTERNS.clapping;
    const every = clamp(o.every ?? 1, 1, 8);
    const ev = [];
    const barOfStep = (at) => { let b = 0; for (let i = 0; i < bars.length; i++) if (bars[i].startStep <= at) b = i; return b; };
    for (let at = 0; at < n; at++) {
      if (pat[at % pat.length]) ev.push({ at, len: 1, ct: 0, vel: 6 });
      const shift = Math.floor(barOfStep(at) / every) % pat.length;
      if (pat[(at + pat.length - shift) % pat.length]) ev.push({ at, len: 1, ct: 2 });
    }
    return ev;
  };
  // Arvo Pärt's tintinnabuli: a melody moving by step (M-voice) and, with each note, the nearest
  // tone of the triad above or below it (T-voice).
  M.tinti = (n, o) => {
    const ev = [];
    const len = clamp(o.noteSteps ?? 2, 1, 16);
    const span = Math.ceil(n / len);
    let k = 0;
    for (let at = 0, i = 0; at < n; at += len, i++) {
      const x = span > 1 ? i / (span - 1) : 0;
      const deg = o.contour === 'down' ? 7 - Math.round(x * 7) : o.contour === 'arch' ? Math.round(Math.sin(x * Math.PI) * 7) : Math.round(x * 7);
      ev.push({ at, len, deg, vel: 4 });
      const side = o.tpos === 'below' ? -1 : o.tpos === 'alt' ? (k++ % 2 ? -1 : 1) : 1;
      ev.push({ at, len, tint: deg, side });
    }
    return ev;
  };
  // Text: Morse code for the rhythm (dot one step, dash three), the letters for the notes.
  const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
  M.text = (n, o) => {
    const txt = String(o.text || 'LUNA').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n');
    const ev = [];
    let at = 0;
    while (at < n) {
      const before = at;
      for (const ch of txt) {
        if (at >= n) break;
        if (ch === ' ') { at += 4; continue; }
        const code = MORSE[ch];
        if (!code) continue;
        const deg = /[a-z]/.test(ch) ? (ch.charCodeAt(0) - 97) % 14 - 3 : Number(ch);
        for (const sym of code) { const len = sym === '-' ? 3 : 1; if (at < n) ev.push({ at, len, deg, vel: sym === '-' ? 8 : 0 }); at += len + 1; }
        at += 2;
      }
      at += 4;
      if (at === before) break;
    }
    return ev;
  };
  // Digits and number sequences as degrees of the scale.
  const cache = {};
  M.digits = (n, o) => {
    const src = o.digits ?? 'pi';
    const ev = [];
    if (src === 'primes') {
      // Prime gaps as durations, the primes themselves (mod 7) as degrees.
      const p = primes(400);
      let at = 0;
      for (let i = 1; i < p.length && at < n; i++) { const len = clamp(p[i] - p[i - 1], 1, 8); ev.push({ at, len, deg: p[i - 1] % 7 }); at += len; }
      return ev;
    }
    if (src === 'collatz') {
      let x = clamp(o.collatz ?? 27, 2, 999), at = 0;
      while (at < n) { ev.push({ at, len: 1, deg: x % 9 - 1 }); x = x === 1 ? clamp(o.collatz ?? 27, 2, 999) : x % 2 ? 3 * x + 1 : x / 2; at++; }
      return ev;
    }
    const need = Math.min(1200, n + 2);
    const key = `${src}:${need}`;
    cache[key] ??= src === 'e' ? eDigits(need) : src === 'phi' ? phiDigits(need) : piDigits(need);
    const d = cache[key];
    for (let at = 0; at < n; at++) { const v = d[at % d.length]; if (v === 0) continue; ev.push({ at, len: 1, deg: v - 1 }); }
    return ev;
  };
  // A twelve-tone row and its mirror forms, one form per chord.
  M.serial = (n, o, r, bars, stepTicks, TPB, segSteps) => {
    const row = Array.from({ length: 12 }, (_, i) => i);
    for (let i = 11; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [row[i], row[j]] = [row[j], row[i]]; }
    const forms = { P: row, I: row.map((p) => (12 - p + row[0] * 2) % 12), R: [...row].reverse() };
    forms.RI = [...forms.I].reverse();
    const order = o.forms === 'all' ? ['P', 'I', 'R', 'RI'] : [o.forms ?? 'P'];
    const ev = [];
    let k = 0, f = 0;
    for (let at = 0; at < n; at++) {
      const seg = segSteps.findIndex((s) => at >= s.from && at < s.to);
      const form = forms[order[(o.forms === 'all' ? Math.max(0, seg) : f) % order.length]];
      ev.push({ at, len: 1, pc: form[k % 12] });
      k++;
    }
    return ev;
  };

  // ---- Rendering ----------------------------------------------------------------------------------
  function generate(segs, bars, S, E, o, key, G) {
    const TPB = G.TPB;
    const step = G.gridTicks(o.rate ?? '1/16', 'n');
    const n = Math.max(0, Math.ceil((E - S) / step));
    const r = G.rng(o.seed ?? 1);
    const barsSteps = bars.map((b) => ({ ...b, startStep: Math.round((b.start - S) / step) }));
    const segSteps = segs.map((s) => ({ from: Math.round((s.start - S) / step), to: Math.round((s.stop - S) / step) }));
    const fn = M[o.method] ?? M.fibMod;
    const events = fn(n, o, r, barsSteps, step, TPB, segSteps);
    const sc = key.minor ? MINOR : MAJOR;
    const center = o.center ?? 60;
    let base = center; while (((base - key.pc) % 12 + 12) % 12 !== 0) base--;
    const degPitch = (d) => { const oct = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return base + sc[i] + 12 * oct; };
    const gate = clamp(o.gate ?? 85, 5, 100) / 100;
    const out = [];
    for (const e of events) {
      const start = S + e.at * step;
      if (start >= E) continue;
      const seg = segs.find((s) => start >= s.start && start < s.stop) ?? segs[segs.length - 1];
      const tones = seg ? G.tones(seg.chord) : [key.pc];
      const rootPc = seg ? seg.chord.root : key.pc;
      let low = center - 7; while (((low - rootPc) % 12 + 12) % 12 !== 0) low++;
      const ctPitch = (c) => { const k = ((c % tones.length) + tones.length) % tones.length, oct = Math.floor(c / tones.length); return low + ((tones[k] - rootPc + 12) % 12) + 12 * oct; };
      let pitch;
      if (e.pitch !== undefined) pitch = e.pitch;
      else if (e.pc !== undefined) { pitch = center - 6; while (((pitch % 12) + 12) % 12 !== e.pc) pitch++; if (o.fitScale) pitch = nearestIn(pitch, (p) => sc.includes(((p - key.pc) % 12 + 12) % 12)); }
      else if (e.ct !== undefined) pitch = ctPitch(e.ct);
      else if (e.tint !== undefined) {
        const m = degPitch(e.tint);
        const isT = (p) => tones.slice(0, 3).includes(((p % 12) + 12) % 12);
        pitch = m + e.side; while (!isT(pitch) || pitch === m) pitch += e.side;
      } else {
        pitch = degPitch(e.deg ?? 0);
        // On the strong beats a scale note can be pulled to the nearest chord tone.
        if (o.chordBeats && Math.round((start - S) % TPB) === 0 && seg) pitch = nearestIn(pitch, (p) => tones.includes(((p % 12) + 12) % 12));
      }
      const onBeat = Math.round((start - S) % TPB) === 0;
      const len = Math.max(1, Math.round(e.len * step * gate));
      out.push({ pitch: clamp(pitch, 0, 127), start, stop: Math.min(E, start + len), velocity: clamp(Math.round((o.vel ?? 92) + (e.vel ?? 0) + (onBeat ? 6 : 0) + (r() - 0.5) * 6), 1, 127) });
    }
    return out;
  }
  function nearestIn(p, ok) { for (let d = 0; d < 12; d++) { if (ok(p - d)) return p - d; if (ok(p + d)) return p + d; } return p; }

  root.MidiAlgo = { generate, methods: Object.keys(M), LSYS: Object.keys(LSYS), PATTERNS: Object.keys(PATTERNS), piDigits, eDigits, phiDigits };
})(typeof window !== 'undefined' ? window : globalThis);
