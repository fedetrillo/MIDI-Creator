// MIDI Creator: the generators, as pure functions. No LUNA here, so they can be checked alone.
//
// Everything works in absolute session ticks. The page passes:
//   segs: [{ start, stop, chord }]  the progression over the span, chord from StrumTheory.parseChord
//   bars: [{ start, beats }]         the bar lines over the span (beats are quarter notes)
//   key:  { pc, minor }              the key, for scale-based choices
// and gets back notes: [{ pitch, start, stop, velocity }].

(function (root) {
  let TPB = 960;
  const setTPB = (v) => { if (v > 0) TPB = v; };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10];

  function rng(seed) {
    let x = (seed * 2654435761) >>> 0 || 1;
    return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  const FEEL = { n: 1, t: 2 / 3, d: 1.5 };
  const gridTicks = (grid, feel = 'n') => { const [a, b] = String(grid).split('/').map(Number); return Math.round(((TPB * 4 * (a || 1)) / (b || 1)) * (FEEL[feel] ?? 1)); };

  // ---- The progression ----------------------------------------------------------------------------
  // Common progressions as [semitones above the tonic, triad, seventh chord]. `minor` says which
  // kind of key they belong to; the page offers the ones that fit.
  const PRESETS = {
    pop: { minor: false, chords: [[0, '', 'maj7'], [7, '', '7'], [9, 'm', 'm7'], [5, '', 'maj7']] },
    doowop: { minor: false, chords: [[0, '', 'maj7'], [9, 'm', 'm7'], [5, '', 'maj7'], [7, '', '7']] },
    axis: { minor: false, chords: [[9, 'm', 'm7'], [5, '', 'maj7'], [0, '', 'maj7'], [7, '', '7']] },
    canon: { minor: false, chords: [[0, '', 'maj7'], [7, '', '7'], [9, 'm', 'm7'], [4, 'm', 'm7'], [5, '', 'maj7'], [0, '', 'maj7'], [5, '', 'maj7'], [7, '', '7']] },
    royal: { minor: false, chords: [[5, '', 'maj7'], [7, '', '7'], [4, 'm', 'm7'], [9, 'm', 'm7']] },
    jazz: { minor: false, chords: [[2, 'm', 'm7'], [7, '', '7'], [0, '', 'maj7'], [0, '', 'maj7']] },
    turnaround: { minor: false, chords: [[0, '', 'maj7'], [9, 'm', 'm7'], [2, 'm', 'm7'], [7, '', '7']] },
    blues: { minor: false, chords: [[0, '7', '7'], [0, '7', '7'], [0, '7', '7'], [0, '7', '7'], [5, '7', '7'], [5, '7', '7'], [0, '7', '7'], [0, '7', '7'], [7, '7', '7'], [5, '7', '7'], [0, '7', '7'], [7, '7', '7']] },
    minorPop: { minor: true, chords: [[0, 'm', 'm7'], [8, '', 'maj7'], [3, '', 'maj7'], [10, '', '7']] },
    andalusian: { minor: true, chords: [[0, 'm', 'm7'], [10, '', '7'], [8, '', 'maj7'], [7, '', '7']] },
    epic: { minor: true, chords: [[0, 'm', 'm7'], [8, '', 'maj7'], [10, '', '7'], [0, 'm', 'm7']] },
    minorJazz: { minor: true, chords: [[2, 'm7b5', 'm7b5'], [7, '7', '7'], [0, 'm', 'm7'], [0, 'm', 'm7']] },
    lament: { minor: true, chords: [[0, 'm', 'm7'], [7, '', '7'], [5, 'm', 'm7'], [7, '', '7']] },
  };
  const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const flatKey = (pc, minor) => (minor ? [2, 7, 0, 5, 10, 3].includes(pc) : [5, 10, 3, 8, 1].includes(pc));
  function presetNames(id, pc, minor, sevenths) {
    const p = PRESETS[id];
    if (!p) return [];
    const names = flatKey(pc, minor) ? NAMES_FLAT : NAMES_SHARP;
    return p.chords.map(([st, tri, sev]) => names[(pc + st) % 12] + (sevenths ? sev : tri));
  }

  // Lay `chords` (parsed) end to end from S, each `beatsEach` beats long, repeating to fill the span.
  function lay(chords, beatsEach, S, E) {
    const segs = [];
    if (!chords.length) return segs;
    const len = Math.max(1, Math.round(beatsEach * TPB));
    for (let t = S, i = 0; t < E; t += len, i++) segs.push({ start: t, stop: Math.min(E, t + len), chord: chords[i % chords.length] });
    return segs;
  }
  // The chords on LUNA's chord ruler as segments: each lasts until the next one.
  function fromRuler(list, S, E) {
    const segs = [];
    list.forEach((c, i) => {
      const start = Math.max(S, c.tick), stop = Math.min(E, i + 1 < list.length ? list[i + 1].tick : E);
      if (stop > start) segs.push({ start, stop, chord: c.chord });
    });
    return segs;
  }
  const chordAt = (segs, tick) => segs.find((s) => tick >= s.start && tick < s.stop) ?? null;

  // ---- Voicings -----------------------------------------------------------------------------------
  // The chord's tones, at most four: a fifth is the first to go in a rich chord.
  function tones(chord) {
    let iv = [...new Set(chord.intervals.map((i) => i % 12))];
    if (iv.length > 4 && iv.includes(7)) iv = iv.filter((i) => i !== 7);
    if (iv.length > 4) iv = iv.slice(0, 4);
    return iv.map((i) => (chord.root + i) % 12);
  }
  // Every inversion of the chord in close position, around `center`.
  function closeCandidates(pcs, center) {
    const out = [];
    for (let inv = 0; inv < pcs.length; inv++) {
      const order = [...pcs.slice(inv), ...pcs.slice(0, inv)];
      for (let base = center - 14; base <= center + 2; base++) {
        if (((base % 12) + 12) % 12 !== order[0]) continue;
        const v = [base];
        for (let i = 1; i < order.length; i++) { let p = v[i - 1] + 1; while (((p % 12) + 12) % 12 !== order[i]) p++; v.push(p); }
        out.push(v);
      }
    }
    return out;
  }
  const distance = (a, b) => {
    if (!b) return 0;
    let d = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) d += Math.abs((a[Math.min(i, a.length - 1)] ?? 0) - (b[Math.min(i, b.length - 1)] ?? 0));
    return d;
  };
  function voice(chord, o, prev) {
    const pcs = tones(chord);
    const center = o.center ?? 60;
    let best;
    if (o.voicing === 'wide') {
      // Spread like a pianist's left and right hand: root and fifth low, the colour tones above.
      let r = center - 17; while (((r % 12) + 12) % 12 !== chord.root) r++;
      const up = pcs.filter((p) => p !== chord.root && p !== (chord.root + 7) % 12);
      if (up.length < 2) up.push(chord.root);
      best = [r, r + 7, ...up.map((p) => { let x = r + 12; while (((x % 12) + 12) % 12 !== p) x++; return x; })];
      best = [...new Set(best)].sort((a, b) => a - b);
    } else {
      const cands = closeCandidates(pcs, center).map((v) => {
        if (o.voicing === 'drop2' && v.length >= 3) { const w = v.slice(); const i = w.length - 2; w[i] -= 12; return w.sort((a, b) => a - b); }
        if (o.voicing === 'open' && v.length >= 3) { const w = v.slice(); w[1] += 12; return w.sort((a, b) => a - b); }
        return v;
      });
      // Smooth voice leading from the chord before; the first chord sits nearest the register.
      const mid = (v) => (v[0] + v[v.length - 1]) / 2;
      cands.sort((a, b) => (prev ? distance(a, prev) - distance(b, prev) : 0) + Math.abs(mid(a) - center) * 0.6 - Math.abs(mid(b) - center) * 0.6);
      best = cands[0] ?? [];
    }
    if (o.bass) { let b = best[0] - 12; while (((b % 12) + 12) % 12 !== (chord.bass ?? chord.root)) b--; best = [b, ...best]; }
    return best.map((p) => clamp(p, 0, 127));
  }

  // ---- Rhythm ---------------------------------------------------------------------------------------
  // Hits in one 4-beat bar as [beat, length in beats]; longer or shorter bars repeat or cut them.
  const RHYTHMS = {
    sustain: null,
    half: [[0, 2], [2, 2]],
    quarter: [[0, 1], [1, 1], [2, 1], [3, 1]],
    eighths: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i / 2, 0.5]),
    charleston: [[0, 1.5], [1.5, 0.5], [2, 1.5], [3.5, 0.5]],
    tresillo: [[0, 1.5], [1.5, 1.5], [3, 1]],
    offbeat: [[0.5, 0.5], [1.5, 0.5], [2.5, 0.5], [3.5, 0.5]],
    pop: [[0, 1], [1.5, 1], [2.5, 0.5], [3, 1]],
  };
  // The hit times over the span: [{ start, len }] in ticks.
  function hits(pattern, bars, S, E) {
    const out = [];
    for (const b of bars) {
      const reps = Math.ceil(b.beats / 4);
      for (let r = 0; r < reps; r++) for (const [beat, len] of pattern) {
        const at = r * 4 + beat;
        if (at >= b.beats) continue;
        const start = b.start + Math.round(at * TPB);
        if (start >= S && start < E) out.push({ start, len: Math.round(len * TPB), beat: at });
      }
    }
    return out;
  }

  // ---- Chords -------------------------------------------------------------------------------------
  function chords(segs, bars, S, E, o) {
    const r = rng(o.seed ?? 1);
    const out = [];
    let prev = null;
    const gate = clamp(o.gate ?? 95, 5, 100) / 100;
    const voiced = new Map();
    const voicingFor = (seg) => { if (!voiced.has(seg)) { voiced.set(seg, voice(seg.chord, o, prev)); prev = voiced.get(seg); } return voiced.get(seg); };
    let list;
    if (!RHYTHMS[o.rhythm]) list = segs.map((s) => ({ start: s.start, len: s.stop - s.start, beat: 0 }));
    else {
      list = hits(RHYTHMS[o.rhythm], bars, S, E);
      // Every chord change gets a hit, even where the pattern has none.
      for (const s of segs) if (!list.some((h) => h.start === s.start)) list.push({ start: s.start, len: Math.round(TPB), beat: 0 });
      list.sort((a, b) => a.start - b.start);
    }
    // Anticipation: the change lands an eighth early, the pop and funk way.
    const push = o.push ? Math.round(TPB / 2) : 0;
    if (push) {
      for (const s of segs) {
        if (s.start <= S) continue;
        const h = list.find((x) => x.start === s.start);
        if (!h) continue;
        list = list.filter((x) => !(x.start >= s.start - push && x.start < s.start));
        h.start -= push; h.len += push; h.pushed = s;
      }
      list.sort((a, b) => a.start - b.start);
    }
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      const seg = h.pushed ?? chordAt(segs, h.start);
      if (!seg) continue;
      const next = i + 1 < list.length ? list[i + 1].start : E;
      const room = Math.min(next, h.pushed ? h.pushed.stop : seg.stop, E) - h.start;
      const len = Math.max(Math.round(TPB / 32), Math.round(Math.min(h.len, room) * gate));
      const acc = h.beat % 1 === 0 && h.beat % 2 === 0 ? 8 : 0;
      for (const p of voicingFor(seg)) out.push({ pitch: p, start: h.start, stop: h.start + len, velocity: clamp(Math.round((o.vel ?? 90) + acc + (r() - 0.5) * 6), 1, 127) });
    }
    return out;
  }

  // ---- Arpeggios -----------------------------------------------------------------------------------
  function order(pool, mode, n, r) {
    const up = [...pool].sort((a, b) => a - b), down = [...up].reverse();
    if (mode === 'down') return down;
    if (mode === 'updown') return up.length > 2 ? [...up, ...down.slice(1, -1)] : up;
    if (mode === 'downup') return down.length > 2 ? [...down, ...up.slice(1, -1)] : down;
    if (mode === 'converge') { const o = []; let a = 0, b = up.length - 1; while (a <= b) { o.push(up[a++]); if (a <= b) o.push(up[b--]); } return o; }
    if (mode === 'pedal') { const o = []; for (const p of up.slice(1)) o.push(up[0], p); return o.length ? o : up; }
    if (mode === 'random') return Array.from({ length: Math.max(n, up.length) }, () => up[Math.floor(r() * up.length)]);
    return up;
  }
  function arpeggio(segs, bars, S, E, o) {
    const r = rng(o.seed ?? 1);
    const step = gridTicks(o.rate ?? '1/16', o.feel ?? 'n');
    const gate = clamp(o.gate ?? 80, 5, 100) / 100;
    const out = [];
    let prev = null, i = 0;
    for (const seg of segs) {
      const v = voice(seg.chord, { center: o.center ?? 60, voicing: 'close' }, prev);
      prev = v;
      const pool = [];
      for (let k = 0; k < clamp(o.octaves ?? 1, 1, 4); k++) for (const p of v) pool.push(p + 12 * k);
      const seq = order([...new Set(pool)], o.mode ?? 'up', Math.ceil((seg.stop - seg.start) / step), r);
      if (o.restart !== false) i = 0;
      // Steps sit on the grid counted from the start of the span, so a pattern keeps its place.
      const first = S + Math.ceil((seg.start - S) / step) * step;
      for (let t = first; t < seg.stop; t += step, i++) {
        const onBeat = Math.round((t - S) % TPB) === 0;
        out.push({ pitch: clamp(seq[i % seq.length], 0, 127), start: t, stop: t + Math.max(1, Math.round(Math.min(step, seg.stop - t) * gate)), velocity: clamp(Math.round((o.vel ?? 90) + (onBeat ? (o.accent ?? 12) : 0) + (r() - 0.5) * 6), 1, 127) });
      }
    }
    return out;
  }

  // ---- Euclidean rhythms ---------------------------------------------------------------------------
  // `pulses` hits spread as evenly as possible over `steps` (Bjorklund), turned by `rotate`.
  function euclid(steps, pulses, rotate = 0) {
    steps = clamp(Math.round(steps), 1, 64); pulses = clamp(Math.round(pulses), 0, steps);
    const pat = Array.from({ length: steps }, (_, i) => Math.floor(((i + 1) * pulses) / steps) - Math.floor((i * pulses) / steps) === 1);
    // Start the pattern on a hit, the usual way of writing them, then rotate.
    const first = pat.indexOf(true);
    const base = first > 0 ? [...pat.slice(first), ...pat.slice(0, first)] : pat;
    const k = ((Math.round(rotate) % steps) + steps) % steps;
    return [...base.slice(steps - k), ...base.slice(0, steps - k)];
  }
  function scalePitch(key, degree, base) {
    const sc = key.minor ? MINOR : MAJOR;
    const oct = Math.floor(degree / sc.length), d = ((degree % sc.length) + sc.length) % sc.length;
    return base + key.pc + sc[d] + 12 * oct;
  }
  function euclidean(segs, bars, S, E, o, key) {
    const out = [];
    (o.layers ?? []).forEach((L, li) => {
      if (!L.on) return;
      const r = rng((o.seed ?? 1) * 31 + li);
      const pat = euclid(L.steps, L.pulses, L.rotate);
      const step = gridTicks(L.rate ?? '1/16', 'n');
      const gate = clamp(L.gate ?? 50, 5, 100) / 100;
      let hit = 0, walk = 0;
      for (let i = 0, t = S; t < E; i++, t += step) {
        if (!pat[i % pat.length]) continue;
        const seg = chordAt(segs, t);
        let pitch = L.note ?? 36;
        if (L.source !== 'note') {
          const base = 12 * ((L.octave ?? 4) + 1);
          if (L.source === 'root' && seg) { pitch = base + seg.chord.root; }
          else if (L.source === 'chord' && seg) { const v = tones(seg.chord); pitch = base + seg.chord.root + ((v[hit % v.length] - seg.chord.root + 12) % 12); }
          else if (L.source === 'scale') { walk += [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)]; walk = clamp(walk, -3, 10); pitch = scalePitch(key, walk, base); }
          else if (seg) pitch = base + seg.chord.root;
        }
        const accent = i % pat.length === pat.indexOf(true) ? 12 : 0;
        out.push({ pitch: clamp(pitch, 0, 127), start: t, stop: t + Math.max(1, Math.round(step * gate)), velocity: clamp(Math.round((L.vel ?? 95) + accent + (r() - 0.5) * 8), 1, 127) });
        hit++;
      }
    });
    return out;
  }

  // ---- Bass -----------------------------------------------------------------------------------------
  function bassRoot(pc, octave) {
    let p = 12 * (octave + 1) + pc;
    if (pc > 7) p -= 12;   // keep the line between G# and G, where basses live
    return p;
  }
  function bass(segs, bars, S, E, o, key) {
    const r = rng(o.seed ?? 1);
    const oct = o.octave ?? 2;
    const gate = clamp(o.gate ?? 90, 5, 100) / 100;
    const vel = (x = 0) => clamp(Math.round((o.vel ?? 100) + x + (r() - 0.5) * 6), 1, 127);
    const out = [];
    const add = (pitch, start, len, v = 0) => { if (start >= E) return; out.push({ pitch: clamp(pitch, 0, 127), start, stop: Math.min(E, start + Math.max(1, Math.round(len * gate))), velocity: vel(v) }); };
    const style = o.style ?? 'root';
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si], next = segs[si + 1];
      const R = bassRoot(seg.chord.bass ?? seg.chord.root, oct);
      const iv = seg.chord.intervals;
      const third = iv.includes(4) ? 4 : iv.includes(3) ? 3 : 7;
      const fifth = iv.includes(7) ? 7 : iv.includes(6) ? 6 : iv.includes(8) ? 8 : 7;
      const len = seg.stop - seg.start;
      const beats = Math.max(1, Math.round(len / TPB));
      const nextR = next ? bassRoot(next.chord.bass ?? next.chord.root, oct) : R;
      if (style === 'root') add(R, seg.start, len, 4);
      else if (style === 'pulse') for (let t = seg.start; t < seg.stop; t += TPB / 2) add(R, t, TPB / 2, (t - seg.start) % TPB === 0 ? 6 : -4);
      else if (style === 'octaves') { let k = 0; for (let t = seg.start; t < seg.stop; t += TPB / 2, k++) add(R + (k % 2 ? 12 : 0), t, TPB / 2, k % 2 ? -6 : 6); }
      else if (style === 'rootFifth') for (let b = 0; b < beats; b += 2) add(b % 4 === 0 ? R : R + fifth - (R + fifth > R + 12 ? 12 : 0), seg.start + b * TPB, Math.min(2, beats - b) * TPB, b % 4 === 0 ? 6 : 0);
      else if (style === 'arp') { const line = [0, third, fifth, 12]; for (let b = 0; b < beats; b++) add(R + line[b % 4], seg.start + b * TPB, TPB, b % 4 === 0 ? 6 : 0); }
      else if (style === 'pop') {
        for (const bar of bars.filter((x) => x.start >= seg.start && x.start < seg.stop)) for (const [beat, l, up] of [[0, 1.5, 0], [1.5, 1, 0], [2.5, 0.5, 12], [3, 1, 0]]) {
          const t = bar.start + Math.round(beat * TPB);
          if (t < seg.stop && beat < bar.beats) add(R + up, t, Math.min(l * TPB, seg.stop - t), beat === 0 ? 6 : 0);
        }
      } else if (style === 'walking') {
        // Quarter notes: the root on the downbeat, chord and scale tones in between, and a
        // chromatic or scale approach into the next chord's root.
        const sc = key.minor ? MINOR : MAJOR;
        const inScale = (p) => sc.includes((((p - key.pc) % 12) + 12) % 12);
        let p = R;
        for (let b = 0; b < beats; b++) {
          const t = seg.start + b * TPB;
          if (b === 0) p = R;
          else if (b === beats - 1 && next) {
            const target = nextR + (Math.abs(nextR - p) > 7 ? (nextR > p ? -12 : 12) : 0);
            p = r() < 0.6 ? target + (p <= target ? -1 : 1) : target + (p <= target ? -2 : 2);
          } else {
            const options = [R + third, R + fifth, R + 12, R + fifth - 12, p + 2, p - 2, p + 1].filter((x) => x !== p && x >= R - 5 && x <= R + 14 && (inScale(x) || [R + third, R + fifth].includes(x)));
            p = options.length ? options[Math.floor(r() * options.length)] : R + fifth;
          }
          add(p, t, TPB, b === 0 ? 6 : b % 2 ? -4 : 0);
        }
      }
    }
    return out;
  }

  const algo = (segs, bars, S, E, o, key) => root.MidiAlgo.generate(segs, bars, S, E, o, key, root.MidiCreate);
  const GENERATORS = { chords, arpeggio, euclidean, bass, algo };
  const generate = (kind, segs, bars, S, E, o, key) => GENERATORS[kind](segs, bars, S, E, o, key ?? { pc: 0, minor: false });

  root.MidiCreate = { setTPB, get TPB() { return TPB; }, gridTicks, PRESETS, presetNames, lay, fromRuler, chordAt, voice, tones, RHYTHMS, hits, euclid, generate, rng };
})(typeof window !== 'undefined' ? window : globalThis);
