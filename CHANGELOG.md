# Changelog

## 1.0.2 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 1.0.1 — 2026-11-25

- A short getting-started guide: the first time it opens it asks for your language, then walks
  you through the window in it. The **Guide** button brings it back.

## 1.0.0 — 2026-11-24

- First release.
- **Progression:** pick a key (or read it from LUNA), then build a progression from the key's
  chords and borrowed chords, start from one of 13 common progressions (pop, 50s, canon, jazz
  ii–V–I, 12-bar blues, Andalusian…), or follow LUNA's chord ruler. Triads or sevenths, two bars,
  one bar or half a bar per chord.
- **Chords:** close, open, drop 2 or wide voicings with smooth voice leading, eight rhythms
  (held, halves, quarters, eighths, Charleston, tresillo, offbeats, pop), anticipated changes and
  an optional bass note.
- **Arpeggio:** up, down, up-down, down-up, converge, pedal or random, 1/4 to 1/32 straight,
  triplet or dotted, over 1 to 4 octaves, with gate and accent.
- **Euclidean:** three layers of steps, hits and rotation, each playing a drum note, the root,
  the chord tones or a walk on the scale.
- **Bass:** root, pulse, octaves, root–fifth, arpeggio, pop or walking, following the progression.
- **Algorithmic:** eleven methods, all in the key and following the chords: Fibonacci durations,
  Fibonacci melody (mod 7, a 16-note loop), the Fibonacci word rhythm, cellular automata (rules
  30 to 150), L-systems (Fibonacci, Cantor, Koch, dragon), chaos with the logistic map, Steve
  Reich's phasing, Arvo Pärt's tintinnabuli, a twelve-tone row, text to music (Morse rhythm,
  letters as notes) and the digits of π, e and φ, the primes or a Collatz sequence.
- Writes on the selected MIDI track over the selection, the loop or 1 to 8 bars, replacing what
  is there or adding to it; the clip grows when it needs to. Each Create is one undo step.
- Preview with the chords over the bars, Variation for a new take, dark and grey themes, seven
  colours, 7 languages, Alt-click the version for a support report.
