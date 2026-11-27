// MIDI Creator: build a chord progression in a key (or follow LUNA's chord ruler) and write
// chords, arpeggios, Euclidean rhythms or a bass line from it on the selected MIDI track.
//
// The generators live in generate.js and the chord names in theory.js; this page is the window,
// the preview and the writing. Each Create is one undo step.

(() => {
  const $ = (id) => document.getElementById(id);
  const T = window.StrumTheory, G = window.MidiCreate;
  const VERSION = '1.0.2';
  const KEY = 'com.fedetrillo.midicreator.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };

  const I18N = {
    en: {
      _name: 'English', noTrack: 'Select a MIDI track in LUNA', noTrackSub: 'An instrument track: the notes are written there.',
      algo: "Algorithmic", method: "Method", gFib: "Fibonacci", gSys: "Systems", gComp: "Composers", gFun: "Curiosities", m_fibDur: "Fibonacci durations", m_fibMod: "Fibonacci melody (mod 7)", m_fibWord: "Fibonacci word rhythm", m_cellular: "Cellular automaton", m_lsystem: "L-system", m_logistic: "Chaos (logistic map)", m_phasing: "Phasing (Steve Reich)", m_tinti: "Tintinnabuli (Arvo Pärt)", m_serial: "Twelve-tone row", m_text: "Text to music", m_digits: "Digits and numbers", h_fibDur: "Notes 1, 1, 2, 3, 5, 8… steps long, climbing the chord: a rhythm that keeps stretching.", h_fibMod: "The Fibonacci numbers divided by 7 give scale degrees that repeat every 16 notes: a melody that loops by itself.", h_fibWord: "1011010110110…, built on the golden ratio: a rhythm that almost repeats and never quite does.", h_cellular: "Each bar grows from the one before by a simple rule. Live cells play.", h_lsystem: "A word rewritten again and again and read as a melody: the same shape at every scale, like a fractal.", h_logistic: "One knob from order to chaos: low values repeat, around 3.5 the pattern doubles, near 4 it never repeats.", h_phasing: "Two voices play the same pattern; the second moves one step every few bars until they meet again.", h_tinti: "A melody moving by step and, with each note, the nearest note of the triad: Arvo Pärt’s bells.", h_serial: "A row of the twelve notes and its mirror forms, one form per chord.", h_text: "Morse code for the rhythm, the letters for the notes. Try the song’s name.", h_digits: "The digits of π, e or φ, the primes (gaps as lengths) or a Collatz sequence, as scale degrees.", terms: "Up to", offset: "Start", rule: "Rule", startRow: "First row", stCenter: "One cell", stRandom: "Random", cells: "Cells", grammar: "Grammar", dragon: "Dragon", iter: "Generations", chaos: "Chaos", rests: "Rests", pattern: "Pattern", shiftEvery: "Move every", tpos: "Bell voice", tAbove: "Above", tBelow: "Below", tAlt: "Alternating", contour: "Melody", cUp: "Rises", cDown: "Falls", cArch: "Arch", noteLen: "Note steps", forms: "Forms", fAll: "All four", fitScale: "Bend the row to the key’s scale", textLbl: "Text", numbers: "Numbers", primes: "Primes", startN: "Start", chordBeats: "Chord tones on the beats",
      spanSel: 'Selection', bars: '{n} bars', bar1: '1 bar', replace: 'Replace', add: 'Add',
      rangeSel: 'Bars {a} to {b}', rangeLoop: 'Loop · bars {a} to {b}', rangeFrom: '{n} bars from {a}',
      key: 'Key', major: 'Major', minor: 'Minor', fromLuna: 'From LUNA', noKeyLuna: 'The session has no key signature: pick the key by hand.',
      mine: 'My progression', ruler: 'LUNA chord ruler', emptyProg: 'Click the chords below to build a progression, or pick a preset.', emptyRuler: 'LUNA’s chord ruler has no chords in this range.',
      preset: 'Presets…', sevenths: 'Sevenths', clear: 'Clear', len2: '2 bars', len1: '1 bar', lenH: '½ bar',
      pop: 'Pop · I–V–vi–IV', doowop: '50s · I–vi–IV–V', axis: 'Sad pop · vi–IV–I–V', canon: 'Canon · I–V–vi–iii–IV–I–IV–V', royal: 'Royal road · IV–V–iii–vi', jazz: 'Jazz · ii–V–I', turnaround: 'Turnaround · I–vi–ii–V', blues: '12-bar blues',
      minorPop: 'Minor pop · i–VI–III–VII', andalusian: 'Andalusian · i–VII–VI–V', epic: 'Epic · i–VI–VII–i', minorJazz: 'Minor jazz · iiø–V–i', lament: 'Minor · i–V–iv–V',
      chords: 'Chords', arpeggio: 'Arpeggio', euclidean: 'Euclidean', bass: 'Bass',
      voicing: 'Voicing', vClose: 'Close', vOpen: 'Open', vDrop2: 'Drop 2', vWide: 'Wide', rhythm: 'Rhythm',
      rSustain: 'Held', rHalf: 'Halves', rQuarter: 'Quarters', rEighths: 'Eighths', rCharleston: 'Charleston', rTresillo: 'Tresillo 3-3-2', rOffbeat: 'Offbeats', rPop: 'Pop',
      register: 'Register', vel: 'Velocity', gate: 'Gate', push: 'Anticipate the changes (an eighth early)', addBass: 'Add the bass note an octave below',
      mode: 'Pattern', aUp: 'Up', aDown: 'Down', aUpDown: 'Up-down', aDownUp: 'Down-up', aConverge: 'Converge', aPedal: 'Pedal', aRandom: 'Random', rate: 'Rate', feel: 'Feel', feelN: 'Straight', feelT: 'Triplet', feelD: 'Dotted', octaves: 'Octaves', accent: 'Accent',
      layer: 'Layer {n}', on: 'On', steps: 'Steps', pulses: 'Hits', rotate: 'Rotate', source: 'Plays', sNote: 'A note', sRoot: 'Root', sChord: 'Chord tones', sScale: 'Scale', note: 'Note', octave: 'Octave',
      style: 'Style', bRoot: 'Root', bPulse: 'Pulse', bOctaves: 'Octaves', bRootFifth: 'Root–fifth', bArp: 'Arpeggio', bPop: 'Pop', bWalking: 'Walking',
      eucHint: 'Spreads the hits as evenly as possible over the steps: 3 in 8 is the tresillo, 5 in 8 the cinquillo.',
      preview: 'Preview', dice: 'Variation', undo: 'Undo', create: 'Create', createWhat: 'Create · {what}',
      created: '{what}: {n} notes written on {track}', undone: 'Undone', failed: 'Error: {e}', working: 'Writing…', partial: 'Part of the range has a clip and part has not: select a range inside one clip, or an empty one.',
      noChords: 'Build a progression first', waiting: 'Waiting for LUNA…', noSession: 'Open a session in LUNA.', report: 'Report copied',
      dark: 'Dark', grey: 'Grey', color: 'Colour', cYellow: 'Yellow', cOrange: 'Orange', cRed: 'Red', cGreen: 'Green', cBlue: 'Blue', cPink: 'Pink', cPurple: 'Purple',
    },
    es: {
      _name: 'Español', noTrack: 'Selecciona una pista MIDI en LUNA', noTrackSub: 'Una pista de instrumento: las notas se escriben ahí.',
      algo: "Algorítmico", method: "Método", gFib: "Fibonacci", gSys: "Sistemas", gComp: "Compositores", gFun: "Curiosidades", m_fibDur: "Duraciones de Fibonacci", m_fibMod: "Melodía de Fibonacci (mód. 7)", m_fibWord: "Ritmo de la palabra de Fibonacci", m_cellular: "Autómata celular", m_lsystem: "L-system", m_logistic: "Caos (mapa logístico)", m_phasing: "Phasing (Steve Reich)", m_tinti: "Tintinnabuli (Arvo Pärt)", m_serial: "Serie dodecafónica", m_text: "Texto a música", m_digits: "Dígitos y números", h_fibDur: "Notas de 1, 1, 2, 3, 5, 8… pasos, subiendo por el acorde: un ritmo que se va estirando.", h_fibMod: "Los números de Fibonacci divididos entre 7 dan grados de la escala que se repiten cada 16 notas: una melodía que hace bucle sola.", h_fibWord: "1011010110110…, basado en la proporción áurea: un ritmo que casi se repite y nunca del todo.", h_cellular: "Cada compás nace del anterior con una regla sencilla. Suenan las células vivas.", h_lsystem: "Una palabra reescrita una y otra vez y leída como melodía: la misma forma a todas las escalas, como un fractal.", h_logistic: "Un mando del orden al caos: los valores bajos repiten, hacia 3,5 el patrón se duplica, cerca de 4 nunca se repite.", h_phasing: "Dos voces tocan el mismo patrón; la segunda se adelanta un paso cada pocos compases hasta volver a coincidir.", h_tinti: "Una melodía por grados y, con cada nota, la nota más cercana de la tríada: las campanas de Arvo Pärt.", h_serial: "Una serie de las doce notas y sus formas espejo, una forma por acorde.", h_text: "El código Morse da el ritmo y las letras las notas. Prueba con el nombre de la canción.", h_digits: "Las cifras de π, e o φ, los primos (los huecos como duraciones) o una secuencia de Collatz, como grados de la escala.", terms: "Hasta", offset: "Inicio", rule: "Regla", startRow: "Primera fila", stCenter: "Una célula", stRandom: "Aleatoria", cells: "Células", grammar: "Gramática", dragon: "Dragón", iter: "Generaciones", chaos: "Caos", rests: "Silencios", pattern: "Patrón", shiftEvery: "Desplazar cada", tpos: "Voz campana", tAbove: "Arriba", tBelow: "Abajo", tAlt: "Alternada", contour: "Melodía", cUp: "Sube", cDown: "Baja", cArch: "Arco", noteLen: "Pasos por nota", forms: "Formas", fAll: "Las cuatro", fitScale: "Ajustar la serie a la escala del tono", textLbl: "Texto", numbers: "Números", primes: "Primos", startN: "Inicio", chordBeats: "Notas del acorde en los tiempos",
      spanSel: 'Selección', bars: '{n} compases', bar1: '1 compás', replace: 'Reemplazar', add: 'Añadir',
      rangeSel: 'Compases {a} a {b}', rangeLoop: 'Bucle · compases {a} a {b}', rangeFrom: '{n} compases desde el {a}',
      key: 'Tono', major: 'Mayor', minor: 'Menor', fromLuna: 'De LUNA', noKeyLuna: 'La sesión no tiene armadura: elige el tono a mano.',
      mine: 'Mi progresión', ruler: 'Regla de acordes de LUNA', emptyProg: 'Pulsa los acordes de abajo para montar una progresión, o elige una predefinida.', emptyRuler: 'La regla de acordes de LUNA no tiene acordes en este rango.',
      preset: 'Predefinidas…', sevenths: 'Cuatriadas', clear: 'Borrar', len2: '2 compases', len1: '1 compás', lenH: '½ compás',
      pop: 'Pop · I–V–vi–IV', doowop: 'Años 50 · I–vi–IV–V', axis: 'Pop triste · vi–IV–I–V', canon: 'Canon · I–V–vi–iii–IV–I–IV–V', royal: 'Royal road · IV–V–iii–vi', jazz: 'Jazz · ii–V–I', turnaround: 'Turnaround · I–vi–ii–V', blues: 'Blues de 12 compases',
      minorPop: 'Pop menor · i–VI–III–VII', andalusian: 'Andaluza · i–VII–VI–V', epic: 'Épica · i–VI–VII–i', minorJazz: 'Jazz menor · iiø–V–i', lament: 'Menor · i–V–iv–V',
      chords: 'Acordes', arpeggio: 'Arpegio', euclidean: 'Euclidiano', bass: 'Bajo',
      voicing: 'Voicing', vClose: 'Cerrado', vOpen: 'Abierto', vDrop2: 'Drop 2', vWide: 'Amplio', rhythm: 'Ritmo',
      rSustain: 'Sostenido', rHalf: 'Blancas', rQuarter: 'Negras', rEighths: 'Corcheas', rCharleston: 'Charleston', rTresillo: 'Tresillo 3-3-2', rOffbeat: 'Contratiempos', rPop: 'Pop',
      register: 'Registro', vel: 'Velocidad', gate: 'Gate', push: 'Anticipar los cambios (una corchea antes)', addBass: 'Añadir el bajo una octava por debajo',
      mode: 'Patrón', aUp: 'Arriba', aDown: 'Abajo', aUpDown: 'Arriba-abajo', aDownUp: 'Abajo-arriba', aConverge: 'Convergente', aPedal: 'Pedal', aRandom: 'Aleatorio', rate: 'Rejilla', feel: 'Figura', feelN: 'Normal', feelT: 'Tresillo', feelD: 'Puntillo', octaves: 'Octavas', accent: 'Acento',
      layer: 'Capa {n}', on: 'Activa', steps: 'Pasos', pulses: 'Golpes', rotate: 'Rotación', source: 'Toca', sNote: 'Una nota', sRoot: 'Fundamental', sChord: 'Notas del acorde', sScale: 'Escala', note: 'Nota', octave: 'Octava',
      style: 'Estilo', bRoot: 'Fundamental', bPulse: 'Pulso', bOctaves: 'Octavas', bRootFifth: 'Fund.–quinta', bArp: 'Arpegio', bPop: 'Pop', bWalking: 'Walking',
      eucHint: 'Reparte los golpes lo más igual posible entre los pasos: 3 en 8 es el tresillo, 5 en 8 el cinquillo.',
      preview: 'Vista previa', dice: 'Variación', undo: 'Deshacer', create: 'Crear', createWhat: 'Crear · {what}',
      created: '{what}: {n} notas escritas en {track}', undone: 'Deshecho', failed: 'Error: {e}', working: 'Escribiendo…', partial: 'Parte del rango tiene clip y parte no: selecciona un rango dentro de un clip, o uno vacío.',
      noChords: 'Monta primero una progresión', waiting: 'Esperando a LUNA…', noSession: 'Abre una sesión en LUNA.', report: 'Informe copiado',
      dark: 'Oscuro', grey: 'Gris', color: 'Color', cYellow: 'Amarillo', cOrange: 'Naranja', cRed: 'Rojo', cGreen: 'Verde', cBlue: 'Azul', cPink: 'Rosa', cPurple: 'Morado',
    },
  };
  Object.assign(I18N, {"ca": {"algo": "Algorítmic", "method": "Mètode", "gFib": "Fibonacci", "gSys": "Sistemes", "gComp": "Compositors", "gFun": "Curiositats", "m_fibDur": "Durades de Fibonacci", "m_fibMod": "Melodia de Fibonacci (mòd. 7)", "m_fibWord": "Ritme de la paraula de Fibonacci", "m_cellular": "Autòmat cel·lular", "m_lsystem": "L-system", "m_logistic": "Caos (mapa logístic)", "m_phasing": "Phasing (Steve Reich)", "m_tinti": "Tintinnabuli (Arvo Pärt)", "m_serial": "Sèrie dodecafònica", "m_text": "Text a música", "m_digits": "Dígits i nombres", "h_fibDur": "Notes d’1, 1, 2, 3, 5, 8… passos, pujant per l’acord: un ritme que es va estirant.", "h_fibMod": "Els nombres de Fibonacci dividits entre 7 donen graus de l’escala que es repeteixen cada 16 notes: una melodia que fa bucle sola.", "h_fibWord": "1011010110110…, basat en la proporció àuria: un ritme que gairebé es repeteix i mai del tot.", "h_cellular": "Cada compàs neix de l’anterior amb una regla senzilla. Sonen les cèl·lules vives.", "h_lsystem": "Una paraula reescrita una vegada i una altra i llegida com a melodia: la mateixa forma a totes les escales, com un fractal.", "h_logistic": "Un comandament de l’ordre al caos: els valors baixos repeteixen, cap a 3,5 el patró es duplica, a prop de 4 mai es repeteix.", "h_phasing": "Dues veus toquen el mateix patró; la segona s’avança un pas cada pocs compassos fins que tornen a coincidir.", "h_tinti": "Una melodia per graus i, amb cada nota, la nota més propera de la tríada: les campanes d’Arvo Pärt.", "h_serial": "Una sèrie de les dotze notes i les seves formes mirall, una forma per acord.", "h_text": "El codi Morse dona el ritme i les lletres les notes. Prova-ho amb el nom de la cançó.", "h_digits": "Les xifres de π, e o φ, els primers (els buits com a durades) o una seqüència de Collatz, com a graus de l’escala.", "terms": "Fins a", "offset": "Inici", "rule": "Regla", "startRow": "Primera fila", "stCenter": "Una cèl·lula", "stRandom": "Aleatòria", "cells": "Cèl·lules", "grammar": "Gramàtica", "dragon": "Drac", "iter": "Generacions", "chaos": "Caos", "rests": "Silencis", "pattern": "Patró", "shiftEvery": "Desplaçar cada", "tpos": "Veu campana", "tAbove": "A dalt", "tBelow": "A baix", "tAlt": "Alternada", "contour": "Melodia", "cUp": "Puja", "cDown": "Baixa", "cArch": "Arc", "noteLen": "Passos per nota", "forms": "Formes", "fAll": "Les quatre", "fitScale": "Ajustar la sèrie a l’escala del to", "textLbl": "Text", "numbers": "Nombres", "primes": "Primers", "startN": "Inici", "chordBeats": "Notes de l’acord als temps", "_name": "Català", "noTrack": "Selecciona una pista MIDI a LUNA", "noTrackSub": "Una pista d’instrument: les notes s’hi escriuen.", "spanSel": "Selecció", "bars": "{n} compassos", "bar1": "1 compàs", "replace": "Substituir", "add": "Afegir", "rangeSel": "Compassos {a} a {b}", "rangeLoop": "Bucle · compassos {a} a {b}", "rangeFrom": "{n} compassos des del {a}", "key": "To", "major": "Major", "minor": "Menor", "fromLuna": "De LUNA", "noKeyLuna": "La sessió no té armadura: tria el to a mà.", "mine": "La meva progressió", "ruler": "Regle d’acords de LUNA", "emptyProg": "Prem els acords de sota per muntar una progressió, o tria’n una de predefinida.", "emptyRuler": "El regle d’acords de LUNA no té acords en aquest rang.", "preset": "Predefinides…", "sevenths": "Quatríades", "clear": "Esborrar", "len2": "2 compassos", "len1": "1 compàs", "lenH": "½ compàs", "pop": "Pop · I–V–vi–IV", "doowop": "Anys 50 · I–vi–IV–V", "axis": "Pop trist · vi–IV–I–V", "canon": "Cànon · I–V–vi–iii–IV–I–IV–V", "royal": "Royal road · IV–V–iii–vi", "jazz": "Jazz · ii–V–I", "turnaround": "Turnaround · I–vi–ii–V", "blues": "Blues de 12 compassos", "minorPop": "Pop menor · i–VI–III–VII", "andalusian": "Andalusa · i–VII–VI–V", "epic": "Èpica · i–VI–VII–i", "minorJazz": "Jazz menor · iiø–V–i", "lament": "Menor · i–V–iv–V", "chords": "Acords", "arpeggio": "Arpegi", "euclidean": "Euclidià", "bass": "Baix", "voicing": "Voicing", "vClose": "Tancat", "vOpen": "Obert", "vDrop2": "Drop 2", "vWide": "Ampli", "rhythm": "Ritme", "rSustain": "Sostingut", "rHalf": "Blanques", "rQuarter": "Negres", "rEighths": "Corxeres", "rCharleston": "Charleston", "rTresillo": "Tresillo 3-3-2", "rOffbeat": "Contratemps", "rPop": "Pop", "register": "Registre", "vel": "Velocitat", "gate": "Gate", "push": "Anticipar els canvis (una corxera abans)", "addBass": "Afegir el baix una octava per sota", "mode": "Patró", "aUp": "Amunt", "aDown": "Avall", "aUpDown": "Amunt-avall", "aDownUp": "Avall-amunt", "aConverge": "Convergent", "aPedal": "Pedal", "aRandom": "Aleatori", "rate": "Graella", "feel": "Figura", "feelN": "Normal", "feelT": "Treset", "feelD": "Amb punt", "octaves": "Octaves", "accent": "Accent", "layer": "Capa {n}", "on": "Activa", "steps": "Passos", "pulses": "Cops", "rotate": "Rotació", "source": "Toca", "sNote": "Una nota", "sRoot": "Fonamental", "sChord": "Notes de l’acord", "sScale": "Escala", "note": "Nota", "octave": "Octava", "style": "Estil", "bRoot": "Fonamental", "bPulse": "Pols", "bOctaves": "Octaves", "bRootFifth": "Fon.–quinta", "bArp": "Arpegi", "bPop": "Pop", "bWalking": "Walking", "eucHint": "Reparteix els cops tan igual com pot entre els passos: 3 en 8 és el tresillo, 5 en 8 el cinquillo.", "preview": "Previsualització", "dice": "Variació", "undo": "Desfer", "create": "Crear", "createWhat": "Crear · {what}", "created": "{what}: {n} notes escrites a {track}", "undone": "Desfet", "failed": "Error: {e}", "working": "Escrivint…", "partial": "Part del rang té clip i part no: selecciona un rang dins d’un clip, o un de buit.", "noChords": "Munta primer una progressió", "waiting": "Esperant LUNA…", "noSession": "Obre una sessió a LUNA.", "report": "Informe copiat", "dark": "Fosc", "grey": "Gris", "color": "Color", "cYellow": "Groc", "cOrange": "Taronja", "cRed": "Vermell", "cGreen": "Verd", "cBlue": "Blau", "cPink": "Rosa", "cPurple": "Lila"},
    "fr": {"algo": "Algorithmique", "method": "Méthode", "gFib": "Fibonacci", "gSys": "Systèmes", "gComp": "Compositeurs", "gFun": "Curiosités", "m_fibDur": "Durées de Fibonacci", "m_fibMod": "Mélodie de Fibonacci (mod 7)", "m_fibWord": "Rythme du mot de Fibonacci", "m_cellular": "Automate cellulaire", "m_lsystem": "L-système", "m_logistic": "Chaos (suite logistique)", "m_phasing": "Phasing (Steve Reich)", "m_tinti": "Tintinnabuli (Arvo Pärt)", "m_serial": "Série dodécaphonique", "m_text": "Texte en musique", "m_digits": "Chiffres et nombres", "h_fibDur": "Des notes de 1, 1, 2, 3, 5, 8… pas qui montent dans l’accord : un rythme qui s’étire.", "h_fibMod": "Les nombres de Fibonacci divisés par 7 donnent des degrés qui se répètent toutes les 16 notes : une mélodie qui boucle d’elle-même.", "h_fibWord": "1011010110110…, fondé sur le nombre d’or : un rythme qui se répète presque, jamais tout à fait.", "h_cellular": "Chaque mesure naît de la précédente par une règle simple. Les cellules vivantes jouent.", "h_lsystem": "Un mot réécrit encore et encore et lu comme une mélodie : la même forme à toutes les échelles, comme une fractale.", "h_logistic": "Un bouton de l’ordre au chaos : les petites valeurs se répètent, vers 3,5 le motif se dédouble, près de 4 il ne se répète jamais.", "h_phasing": "Deux voix jouent le même motif ; la seconde avance d’un pas toutes les quelques mesures jusqu’à ce qu’elles se retrouvent.", "h_tinti": "Une mélodie par degrés et, avec chaque note, la note la plus proche de l’accord : les cloches d’Arvo Pärt.", "h_serial": "Une série des douze notes et ses formes miroirs, une forme par accord.", "h_text": "Le morse donne le rythme et les lettres les notes. Essayez le nom du morceau.", "h_digits": "Les chiffres de π, e ou φ, les nombres premiers (les écarts comme durées) ou une suite de Collatz, en degrés de la gamme.", "terms": "Jusqu’à", "offset": "Départ", "rule": "Règle", "startRow": "Première ligne", "stCenter": "Une cellule", "stRandom": "Aléatoire", "cells": "Cellules", "grammar": "Grammaire", "dragon": "Dragon", "iter": "Générations", "chaos": "Chaos", "rests": "Silences", "pattern": "Motif", "shiftEvery": "Décaler toutes les", "tpos": "Voix cloche", "tAbove": "Au-dessus", "tBelow": "En dessous", "tAlt": "Alternée", "contour": "Mélodie", "cUp": "Monte", "cDown": "Descend", "cArch": "Arche", "noteLen": "Pas par note", "forms": "Formes", "fAll": "Les quatre", "fitScale": "Ajuster la série à la gamme de la tonalité", "textLbl": "Texte", "numbers": "Nombres", "primes": "Premiers", "startN": "Départ", "chordBeats": "Notes de l’accord sur les temps", "_name": "Français", "noTrack": "Sélectionnez une piste MIDI dans LUNA", "noTrackSub": "Une piste d’instrument : les notes y sont écrites.", "spanSel": "Sélection", "bars": "{n} mesures", "bar1": "1 mesure", "replace": "Remplacer", "add": "Ajouter", "rangeSel": "Mesures {a} à {b}", "rangeLoop": "Boucle · mesures {a} à {b}", "rangeFrom": "{n} mesures depuis la {a}", "key": "Tonalité", "major": "Majeur", "minor": "Mineur", "fromLuna": "De LUNA", "noKeyLuna": "La session n’a pas d’armure : choisissez la tonalité à la main.", "mine": "Ma progression", "ruler": "Règle d’accords de LUNA", "emptyProg": "Cliquez sur les accords ci-dessous pour bâtir une progression, ou choisissez-en une toute faite.", "emptyRuler": "La règle d’accords de LUNA n’a pas d’accords dans cette zone.", "preset": "Toutes faites…", "sevenths": "Septièmes", "clear": "Effacer", "len2": "2 mesures", "len1": "1 mesure", "lenH": "½ mesure", "pop": "Pop · I–V–vi–IV", "doowop": "Années 50 · I–vi–IV–V", "axis": "Pop triste · vi–IV–I–V", "canon": "Canon · I–V–vi–iii–IV–I–IV–V", "royal": "Royal road · IV–V–iii–vi", "jazz": "Jazz · ii–V–I", "turnaround": "Turnaround · I–vi–ii–V", "blues": "Blues 12 mesures", "minorPop": "Pop mineur · i–VI–III–VII", "andalusian": "Andalouse · i–VII–VI–V", "epic": "Épique · i–VI–VII–i", "minorJazz": "Jazz mineur · iiø–V–i", "lament": "Mineur · i–V–iv–V", "chords": "Accords", "arpeggio": "Arpège", "euclidean": "Euclidien", "bass": "Basse", "voicing": "Voicing", "vClose": "Serré", "vOpen": "Ouvert", "vDrop2": "Drop 2", "vWide": "Large", "rhythm": "Rythme", "rSustain": "Tenu", "rHalf": "Blanches", "rQuarter": "Noires", "rEighths": "Croches", "rCharleston": "Charleston", "rTresillo": "Tresillo 3-3-2", "rOffbeat": "Contretemps", "rPop": "Pop", "register": "Registre", "vel": "Vélocité", "gate": "Gate", "push": "Anticiper les changements (une croche avant)", "addBass": "Ajouter la basse une octave plus bas", "mode": "Motif", "aUp": "Montant", "aDown": "Descendant", "aUpDown": "Montant-desc.", "aDownUp": "Desc.-montant", "aConverge": "Convergent", "aPedal": "Pédale", "aRandom": "Aléatoire", "rate": "Grille", "feel": "Figure", "feelN": "Normal", "feelT": "Triolet", "feelD": "Pointé", "octaves": "Octaves", "accent": "Accent", "layer": "Couche {n}", "on": "Active", "steps": "Pas", "pulses": "Coups", "rotate": "Rotation", "source": "Joue", "sNote": "Une note", "sRoot": "Fondamentale", "sChord": "Notes de l’accord", "sScale": "Gamme", "note": "Note", "octave": "Octave", "style": "Style", "bRoot": "Fondamentale", "bPulse": "Pulsation", "bOctaves": "Octaves", "bRootFifth": "Fond.–quinte", "bArp": "Arpège", "bPop": "Pop", "bWalking": "Walking", "eucHint": "Répartit les coups le plus régulièrement possible sur les pas : 3 sur 8 donne le tresillo, 5 sur 8 le cinquillo.", "preview": "Aperçu", "dice": "Variation", "undo": "Annuler", "create": "Créer", "createWhat": "Créer · {what}", "created": "{what} : {n} notes écrites sur {track}", "undone": "Annulé", "failed": "Erreur : {e}", "working": "Écriture…", "partial": "Une partie de la zone a un clip et l’autre non : sélectionnez une zone dans un clip, ou une zone vide.", "noChords": "Bâtissez d’abord une progression", "waiting": "En attente de LUNA…", "noSession": "Ouvrez une session dans LUNA.", "report": "Rapport copié", "dark": "Sombre", "grey": "Gris", "color": "Couleur", "cYellow": "Jaune", "cOrange": "Orange", "cRed": "Rouge", "cGreen": "Vert", "cBlue": "Bleu", "cPink": "Rose", "cPurple": "Violet"},
    "de": {"algo": "Algorithmisch", "method": "Methode", "gFib": "Fibonacci", "gSys": "Systeme", "gComp": "Komponisten", "gFun": "Kuriositäten", "m_fibDur": "Fibonacci-Längen", "m_fibMod": "Fibonacci-Melodie (mod 7)", "m_fibWord": "Fibonacci-Wort-Rhythmus", "m_cellular": "Zellulärer Automat", "m_lsystem": "L-System", "m_logistic": "Chaos (logistische Gleichung)", "m_phasing": "Phasing (Steve Reich)", "m_tinti": "Tintinnabuli (Arvo Pärt)", "m_serial": "Zwölftonreihe", "m_text": "Text zu Musik", "m_digits": "Ziffern und Zahlen", "h_fibDur": "Noten von 1, 1, 2, 3, 5, 8… Schritten, die durch den Akkord steigen: ein Rhythmus, der sich dehnt.", "h_fibMod": "Die Fibonacci-Zahlen geteilt durch 7 ergeben Skalenstufen, die sich alle 16 Noten wiederholen: eine Melodie, die von selbst loopt.", "h_fibWord": "1011010110110…, auf dem Goldenen Schnitt gebaut: ein Rhythmus, der sich fast wiederholt, aber nie ganz.", "h_cellular": "Jeder Takt entsteht aus dem vorigen nach einer einfachen Regel. Lebende Zellen spielen.", "h_lsystem": "Ein Wort, immer wieder umgeschrieben und als Melodie gelesen: dieselbe Form in jeder Größe, wie ein Fraktal.", "h_logistic": "Ein Regler von Ordnung zu Chaos: kleine Werte wiederholen sich, um 3,5 verdoppelt sich das Muster, nahe 4 wiederholt es sich nie.", "h_phasing": "Zwei Stimmen spielen dasselbe Muster; die zweite rückt alle paar Takte einen Schritt vor, bis sie wieder zusammenkommen.", "h_tinti": "Eine Melodie in Stufen und zu jeder Note der nächste Ton des Dreiklangs: Arvo Pärts Glocken.", "h_serial": "Eine Reihe der zwölf Töne und ihre Spiegelformen, eine Form pro Akkord.", "h_text": "Morsecode für den Rhythmus, die Buchstaben für die Töne. Probier den Namen des Songs.", "h_digits": "Die Ziffern von π, e oder φ, die Primzahlen (Lücken als Längen) oder eine Collatz-Folge als Skalenstufen.", "terms": "Bis", "offset": "Start", "rule": "Regel", "startRow": "Erste Reihe", "stCenter": "Eine Zelle", "stRandom": "Zufällig", "cells": "Zellen", "grammar": "Grammatik", "dragon": "Drache", "iter": "Generationen", "chaos": "Chaos", "rests": "Pausen", "pattern": "Muster", "shiftEvery": "Verschieben alle", "tpos": "Glockenstimme", "tAbove": "Oben", "tBelow": "Unten", "tAlt": "Wechselnd", "contour": "Melodie", "cUp": "Steigt", "cDown": "Fällt", "cArch": "Bogen", "noteLen": "Schritte pro Note", "forms": "Formen", "fAll": "Alle vier", "fitScale": "Reihe an die Tonleiter anpassen", "textLbl": "Text", "numbers": "Zahlen", "primes": "Primzahlen", "startN": "Start", "chordBeats": "Akkordtöne auf den Zählzeiten", "_name": "Deutsch", "noTrack": "Wähle eine MIDI-Spur in LUNA", "noTrackSub": "Eine Instrumentenspur: Dort werden die Noten geschrieben.", "spanSel": "Auswahl", "bars": "{n} Takte", "bar1": "1 Takt", "replace": "Ersetzen", "add": "Hinzufügen", "rangeSel": "Takte {a} bis {b}", "rangeLoop": "Loop · Takte {a} bis {b}", "rangeFrom": "{n} Takte ab Takt {a}", "key": "Tonart", "major": "Dur", "minor": "Moll", "fromLuna": "Aus LUNA", "noKeyLuna": "Die Session hat keine Tonart: wähle sie von Hand.", "mine": "Meine Progression", "ruler": "Akkordlineal von LUNA", "emptyProg": "Klicke unten auf Akkorde, um eine Progression zu bauen, oder wähle eine Vorlage.", "emptyRuler": "Das Akkordlineal von LUNA hat in diesem Bereich keine Akkorde.", "preset": "Vorlagen…", "sevenths": "Vierklänge", "clear": "Löschen", "len2": "2 Takte", "len1": "1 Takt", "lenH": "½ Takt", "pop": "Pop · I–V–vi–IV", "doowop": "50er · I–vi–IV–V", "axis": "Trauriger Pop · vi–IV–I–V", "canon": "Kanon · I–V–vi–iii–IV–I–IV–V", "royal": "Royal Road · IV–V–iii–vi", "jazz": "Jazz · ii–V–I", "turnaround": "Turnaround · I–vi–ii–V", "blues": "12-Takt-Blues", "minorPop": "Moll-Pop · i–VI–III–VII", "andalusian": "Andalusisch · i–VII–VI–V", "epic": "Episch · i–VI–VII–i", "minorJazz": "Moll-Jazz · iiø–V–i", "lament": "Moll · i–V–iv–V", "chords": "Akkorde", "arpeggio": "Arpeggio", "euclidean": "Euklidisch", "bass": "Bass", "voicing": "Voicing", "vClose": "Eng", "vOpen": "Offen", "vDrop2": "Drop 2", "vWide": "Weit", "rhythm": "Rhythmus", "rSustain": "Gehalten", "rHalf": "Halbe", "rQuarter": "Viertel", "rEighths": "Achtel", "rCharleston": "Charleston", "rTresillo": "Tresillo 3-3-2", "rOffbeat": "Offbeats", "rPop": "Pop", "register": "Lage", "vel": "Velocity", "gate": "Gate", "push": "Wechsel vorziehen (eine Achtel früher)", "addBass": "Bassnote eine Oktave tiefer hinzufügen", "mode": "Muster", "aUp": "Auf", "aDown": "Ab", "aUpDown": "Auf-ab", "aDownUp": "Ab-auf", "aConverge": "Zusammen", "aPedal": "Pedal", "aRandom": "Zufall", "rate": "Raster", "feel": "Feel", "feelN": "Gerade", "feelT": "Triole", "feelD": "Punktiert", "octaves": "Oktaven", "accent": "Akzent", "layer": "Ebene {n}", "on": "Aktiv", "steps": "Schritte", "pulses": "Schläge", "rotate": "Rotation", "source": "Spielt", "sNote": "Eine Note", "sRoot": "Grundton", "sChord": "Akkordtöne", "sScale": "Skala", "note": "Note", "octave": "Oktave", "style": "Stil", "bRoot": "Grundton", "bPulse": "Puls", "bOctaves": "Oktaven", "bRootFifth": "Gt.–Quinte", "bArp": "Arpeggio", "bPop": "Pop", "bWalking": "Walking", "eucHint": "Verteilt die Schläge so gleichmäßig wie möglich auf die Schritte: 3 auf 8 ist der Tresillo, 5 auf 8 der Cinquillo.", "preview": "Vorschau", "dice": "Variation", "undo": "Rückgängig", "create": "Erzeugen", "createWhat": "Erzeugen · {what}", "created": "{what}: {n} Noten auf {track} geschrieben", "undone": "Rückgängig gemacht", "failed": "Fehler: {e}", "working": "Schreibe…", "partial": "Ein Teil des Bereichs hat einen Clip, ein Teil nicht: wähle einen Bereich in einem Clip oder einen leeren.", "noChords": "Baue zuerst eine Progression", "waiting": "Warte auf LUNA…", "noSession": "Öffne eine Session in LUNA.", "report": "Bericht kopiert", "dark": "Dunkel", "grey": "Grau", "color": "Farbe", "cYellow": "Gelb", "cOrange": "Orange", "cRed": "Rot", "cGreen": "Grün", "cBlue": "Blau", "cPink": "Pink", "cPurple": "Lila"},
    "it": {"algo": "Algoritmico", "method": "Metodo", "gFib": "Fibonacci", "gSys": "Sistemi", "gComp": "Compositori", "gFun": "Curiosità", "m_fibDur": "Durate di Fibonacci", "m_fibMod": "Melodia di Fibonacci (mod 7)", "m_fibWord": "Ritmo della parola di Fibonacci", "m_cellular": "Automa cellulare", "m_lsystem": "L-system", "m_logistic": "Caos (mappa logistica)", "m_phasing": "Phasing (Steve Reich)", "m_tinti": "Tintinnabuli (Arvo Pärt)", "m_serial": "Serie dodecafonica", "m_text": "Testo in musica", "m_digits": "Cifre e numeri", "h_fibDur": "Note di 1, 1, 2, 3, 5, 8… passi che salgono sull’accordo: un ritmo che si allunga.", "h_fibMod": "I numeri di Fibonacci divisi per 7 danno gradi della scala che si ripetono ogni 16 note: una melodia che va in loop da sola.", "h_fibWord": "1011010110110…, basato sulla sezione aurea: un ritmo che quasi si ripete e mai del tutto.", "h_cellular": "Ogni battuta nasce dalla precedente con una regola semplice. Suonano le cellule vive.", "h_lsystem": "Una parola riscritta più volte e letta come melodia: la stessa forma a ogni scala, come un frattale.", "h_logistic": "Una manopola dall’ordine al caos: i valori bassi si ripetono, verso 3,5 lo schema si raddoppia, vicino a 4 non si ripete mai.", "h_phasing": "Due voci suonano lo stesso schema; la seconda avanza di un passo ogni poche battute finché tornano a coincidere.", "h_tinti": "Una melodia per gradi e, con ogni nota, la nota più vicina della triade: le campane di Arvo Pärt.", "h_serial": "Una serie delle dodici note e le sue forme speculari, una forma per accordo.", "h_text": "Il Morse dà il ritmo e le lettere le note. Prova con il nome del brano.", "h_digits": "Le cifre di π, e o φ, i numeri primi (gli intervalli come durate) o una sequenza di Collatz, come gradi della scala.", "terms": "Fino a", "offset": "Inizio", "rule": "Regola", "startRow": "Prima riga", "stCenter": "Una cellula", "stRandom": "Casuale", "cells": "Cellule", "grammar": "Grammatica", "dragon": "Drago", "iter": "Generazioni", "chaos": "Caos", "rests": "Pause", "pattern": "Schema", "shiftEvery": "Sposta ogni", "tpos": "Voce campana", "tAbove": "Sopra", "tBelow": "Sotto", "tAlt": "Alternata", "contour": "Melodia", "cUp": "Sale", "cDown": "Scende", "cArch": "Arco", "noteLen": "Passi per nota", "forms": "Forme", "fAll": "Tutte e quattro", "fitScale": "Adatta la serie alla scala", "textLbl": "Testo", "numbers": "Numeri", "primes": "Primi", "startN": "Inizio", "chordBeats": "Note dell’accordo sui tempi", "_name": "Italiano", "noTrack": "Seleziona una traccia MIDI in LUNA", "noTrackSub": "Una traccia strumento: le note vengono scritte lì.", "spanSel": "Selezione", "bars": "{n} battute", "bar1": "1 battuta", "replace": "Sostituisci", "add": "Aggiungi", "rangeSel": "Battute da {a} a {b}", "rangeLoop": "Loop · battute da {a} a {b}", "rangeFrom": "{n} battute dalla {a}", "key": "Tonalità", "major": "Maggiore", "minor": "Minore", "fromLuna": "Da LUNA", "noKeyLuna": "La sessione non ha armatura: scegli la tonalità a mano.", "mine": "La mia progressione", "ruler": "Righello accordi di LUNA", "emptyProg": "Clicca gli accordi qui sotto per costruire una progressione, o scegline una pronta.", "emptyRuler": "Il righello accordi di LUNA non ha accordi in questo intervallo.", "preset": "Pronte…", "sevenths": "Quadriadi", "clear": "Cancella", "len2": "2 battute", "len1": "1 battuta", "lenH": "½ battuta", "pop": "Pop · I–V–vi–IV", "doowop": "Anni 50 · I–vi–IV–V", "axis": "Pop triste · vi–IV–I–V", "canon": "Canone · I–V–vi–iii–IV–I–IV–V", "royal": "Royal road · IV–V–iii–vi", "jazz": "Jazz · ii–V–I", "turnaround": "Turnaround · I–vi–ii–V", "blues": "Blues in 12 battute", "minorPop": "Pop minore · i–VI–III–VII", "andalusian": "Andalusa · i–VII–VI–V", "epic": "Epica · i–VI–VII–i", "minorJazz": "Jazz minore · iiø–V–i", "lament": "Minore · i–V–iv–V", "chords": "Accordi", "arpeggio": "Arpeggio", "euclidean": "Euclideo", "bass": "Basso", "voicing": "Voicing", "vClose": "Stretto", "vOpen": "Aperto", "vDrop2": "Drop 2", "vWide": "Largo", "rhythm": "Ritmo", "rSustain": "Tenuto", "rHalf": "Minime", "rQuarter": "Semiminime", "rEighths": "Crome", "rCharleston": "Charleston", "rTresillo": "Tresillo 3-3-2", "rOffbeat": "Controtempi", "rPop": "Pop", "register": "Registro", "vel": "Velocity", "gate": "Gate", "push": "Anticipa i cambi (una croma prima)", "addBass": "Aggiungi il basso un’ottava sotto", "mode": "Schema", "aUp": "Su", "aDown": "Giù", "aUpDown": "Su-giù", "aDownUp": "Giù-su", "aConverge": "Convergente", "aPedal": "Pedale", "aRandom": "Casuale", "rate": "Griglia", "feel": "Figura", "feelN": "Normale", "feelT": "Terzina", "feelD": "Puntato", "octaves": "Ottave", "accent": "Accento", "layer": "Livello {n}", "on": "Attivo", "steps": "Passi", "pulses": "Colpi", "rotate": "Rotazione", "source": "Suona", "sNote": "Una nota", "sRoot": "Fondamentale", "sChord": "Note dell’accordo", "sScale": "Scala", "note": "Nota", "octave": "Ottava", "style": "Stile", "bRoot": "Fondamentale", "bPulse": "Pulsazione", "bOctaves": "Ottave", "bRootFifth": "Fond.–quinta", "bArp": "Arpeggio", "bPop": "Pop", "bWalking": "Walking", "eucHint": "Distribuisce i colpi nel modo più uniforme possibile sui passi: 3 su 8 è il tresillo, 5 su 8 il cinquillo.", "preview": "Anteprima", "dice": "Variazione", "undo": "Annulla", "create": "Crea", "createWhat": "Crea · {what}", "created": "{what}: {n} note scritte su {track}", "undone": "Annullato", "failed": "Errore: {e}", "working": "Scrittura…", "partial": "Parte dell’intervallo ha una clip e parte no: seleziona un intervallo dentro una clip, o uno vuoto.", "noChords": "Costruisci prima una progressione", "waiting": "In attesa di LUNA…", "noSession": "Apri una sessione in LUNA.", "report": "Rapporto copiato", "dark": "Scuro", "grey": "Grigio", "color": "Colore", "cYellow": "Giallo", "cOrange": "Arancione", "cRed": "Rosso", "cGreen": "Verde", "cBlue": "Blu", "cPink": "Rosa", "cPurple": "Viola"},
    "pt": {"algo": "Algorítmico", "method": "Método", "gFib": "Fibonacci", "gSys": "Sistemas", "gComp": "Compositores", "gFun": "Curiosidades", "m_fibDur": "Durações de Fibonacci", "m_fibMod": "Melodia de Fibonacci (mód. 7)", "m_fibWord": "Ritmo da palavra de Fibonacci", "m_cellular": "Autómato celular", "m_lsystem": "L-system", "m_logistic": "Caos (mapa logístico)", "m_phasing": "Phasing (Steve Reich)", "m_tinti": "Tintinnabuli (Arvo Pärt)", "m_serial": "Série dodecafónica", "m_text": "Texto para música", "m_digits": "Dígitos e números", "h_fibDur": "Notas de 1, 1, 2, 3, 5, 8… passos, a subir pelo acorde: um ritmo que se vai esticando.", "h_fibMod": "Os números de Fibonacci divididos por 7 dão graus da escala que se repetem a cada 16 notas: uma melodia que faz loop sozinha.", "h_fibWord": "1011010110110…, baseado na proporção áurea: um ritmo que quase se repete e nunca de todo.", "h_cellular": "Cada compasso nasce do anterior com uma regra simples. Tocam as células vivas.", "h_lsystem": "Uma palavra reescrita vezes sem conta e lida como melodia: a mesma forma a todas as escalas, como um fractal.", "h_logistic": "Um botão da ordem ao caos: valores baixos repetem, perto de 3,5 o padrão duplica, perto de 4 nunca se repete.", "h_phasing": "Duas vozes tocam o mesmo padrão; a segunda avança um passo a cada poucos compassos até voltarem a coincidir.", "h_tinti": "Uma melodia por graus e, com cada nota, a nota mais próxima da tríade: os sinos de Arvo Pärt.", "h_serial": "Uma série das doze notas e as suas formas espelho, uma forma por acorde.", "h_text": "O código Morse dá o ritmo e as letras as notas. Experimenta com o nome da música.", "h_digits": "Os algarismos de π, e ou φ, os primos (os intervalos como durações) ou uma sequência de Collatz, como graus da escala.", "terms": "Até", "offset": "Início", "rule": "Regra", "startRow": "Primeira linha", "stCenter": "Uma célula", "stRandom": "Aleatória", "cells": "Células", "grammar": "Gramática", "dragon": "Dragão", "iter": "Gerações", "chaos": "Caos", "rests": "Pausas", "pattern": "Padrão", "shiftEvery": "Deslocar a cada", "tpos": "Voz sino", "tAbove": "Acima", "tBelow": "Abaixo", "tAlt": "Alternada", "contour": "Melodia", "cUp": "Sobe", "cDown": "Desce", "cArch": "Arco", "noteLen": "Passos por nota", "forms": "Formas", "fAll": "As quatro", "fitScale": "Ajustar a série à escala do tom", "textLbl": "Texto", "numbers": "Números", "primes": "Primos", "startN": "Início", "chordBeats": "Notas do acorde nos tempos", "_name": "Português", "noTrack": "Seleciona uma faixa MIDI no LUNA", "noTrackSub": "Uma faixa de instrumento: as notas são escritas aí.", "spanSel": "Seleção", "bars": "{n} compassos", "bar1": "1 compasso", "replace": "Substituir", "add": "Adicionar", "rangeSel": "Compassos {a} a {b}", "rangeLoop": "Loop · compassos {a} a {b}", "rangeFrom": "{n} compassos a partir do {a}", "key": "Tom", "major": "Maior", "minor": "Menor", "fromLuna": "Do LUNA", "noKeyLuna": "A sessão não tem armação: escolhe o tom à mão.", "mine": "A minha progressão", "ruler": "Régua de acordes do LUNA", "emptyProg": "Carrega nos acordes abaixo para montar uma progressão, ou escolhe uma predefinida.", "emptyRuler": "A régua de acordes do LUNA não tem acordes neste intervalo.", "preset": "Predefinidas…", "sevenths": "Tétrades", "clear": "Apagar", "len2": "2 compassos", "len1": "1 compasso", "lenH": "½ compasso", "pop": "Pop · I–V–vi–IV", "doowop": "Anos 50 · I–vi–IV–V", "axis": "Pop triste · vi–IV–I–V", "canon": "Cânone · I–V–vi–iii–IV–I–IV–V", "royal": "Royal road · IV–V–iii–vi", "jazz": "Jazz · ii–V–I", "turnaround": "Turnaround · I–vi–ii–V", "blues": "Blues de 12 compassos", "minorPop": "Pop menor · i–VI–III–VII", "andalusian": "Andaluza · i–VII–VI–V", "epic": "Épica · i–VI–VII–i", "minorJazz": "Jazz menor · iiø–V–i", "lament": "Menor · i–V–iv–V", "chords": "Acordes", "arpeggio": "Arpejo", "euclidean": "Euclidiano", "bass": "Baixo", "voicing": "Voicing", "vClose": "Fechado", "vOpen": "Aberto", "vDrop2": "Drop 2", "vWide": "Amplo", "rhythm": "Ritmo", "rSustain": "Sustentado", "rHalf": "Mínimas", "rQuarter": "Semínimas", "rEighths": "Colcheias", "rCharleston": "Charleston", "rTresillo": "Tresillo 3-3-2", "rOffbeat": "Contratempos", "rPop": "Pop", "register": "Registo", "vel": "Velocidade", "gate": "Gate", "push": "Antecipar as mudanças (uma colcheia antes)", "addBass": "Adicionar o baixo uma oitava abaixo", "mode": "Padrão", "aUp": "Subir", "aDown": "Descer", "aUpDown": "Sobe-desce", "aDownUp": "Desce-sobe", "aConverge": "Convergente", "aPedal": "Pedal", "aRandom": "Aleatório", "rate": "Grelha", "feel": "Figura", "feelN": "Normal", "feelT": "Tercina", "feelD": "Pontuado", "octaves": "Oitavas", "accent": "Acento", "layer": "Camada {n}", "on": "Ativa", "steps": "Passos", "pulses": "Golpes", "rotate": "Rotação", "source": "Toca", "sNote": "Uma nota", "sRoot": "Fundamental", "sChord": "Notas do acorde", "sScale": "Escala", "note": "Nota", "octave": "Oitava", "style": "Estilo", "bRoot": "Fundamental", "bPulse": "Pulso", "bOctaves": "Oitavas", "bRootFifth": "Fund.–quinta", "bArp": "Arpejo", "bPop": "Pop", "bWalking": "Walking", "eucHint": "Distribui os golpes da forma mais igual possível pelos passos: 3 em 8 é o tresillo, 5 em 8 o cinquillo.", "preview": "Pré-visualização", "dice": "Variação", "undo": "Desfazer", "create": "Criar", "createWhat": "Criar · {what}", "created": "{what}: {n} notas escritas em {track}", "undone": "Desfeito", "failed": "Erro: {e}", "working": "A escrever…", "partial": "Parte do intervalo tem clip e parte não: seleciona um intervalo dentro de um clip, ou um vazio.", "noChords": "Monta primeiro uma progressão", "waiting": "À espera do LUNA…", "noSession": "Abre uma sessão no LUNA.", "report": "Relatório copiado", "dark": "Escuro", "grey": "Cinzento", "color": "Cor", "cYellow": "Amarelo", "cOrange": "Laranja", "cRed": "Vermelho", "cGreen": "Verde", "cBlue": "Azul", "cPink": "Rosa", "cPurple": "Roxo"}});

  let lang = store.get('lang') ?? (() => { for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; } return 'en'; })();
  if (!I18N[lang]) lang = 'en';
  const t = (k, v = {}) => String(I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));
  const COLORS = ['yellow', 'orange', 'red', 'green', 'blue', 'pink', 'purple'];

  // The guide: its texts, in every language.
  for (const [c, v] of Object.entries({"en": {"help": "Quick guide", "helpBtn": "Guide", "tNext": "Next", "tBack": "Back", "tSkip": "Skip", "tDone": "Got it", "langT": "Choose your language", "langX": "The guide and the whole window will use it. You can change it later here, at the top right.", "zt": "Always at hand", "z": "Open this guide again whenever you need it with the Guide button.", "q1t": "Where it writes", "q1": "Select an instrument track in LUNA and, if you like, a range or loop. Choose whether the notes replace what is there or are added to it.", "q2t": "Key and progression", "q2": "Pick the key (or take it from LUNA), then build a progression with the chords, choose a preset, or follow LUNA’s Chord ruler.", "q3t": "What to create", "q3": "Chords, Arpeggio, Euclidean, Bass or Algorithmic: one tab each.", "q4t": "Adjust it", "q4": "The settings of the generator you picked. Every change shows at once in the preview.", "q5t": "Preview", "q5": "The notes it will write, bar by bar. Variation rolls a new take with the same settings.", "q6t": "Create", "q6": "Create writes it to the track; Undo (or Cmd+Z in LUNA) takes it back."}, "es": {"help": "Guía rápida", "helpBtn": "Guía", "tNext": "Siguiente", "tBack": "Atrás", "tSkip": "Saltar", "tDone": "Entendido", "langT": "Elige tu idioma", "langX": "La guía y toda la ventana lo usarán. Puedes cambiarlo luego aquí, arriba a la derecha.", "zt": "Siempre a mano", "z": "Vuelve a esta guía cuando la necesites con el botón Guía.", "q1t": "Dónde escribe", "q1": "Selecciona una pista de instrumento en LUNA y, si quieres, un rango o loop. Elige si las notas sustituyen lo que hay o se añaden.", "q2t": "Tono y progresión", "q2": "Elige el tono (o tómalo de LUNA) y monta una progresión con los acordes, elige una predefinida o sigue la regla de acordes de LUNA.", "q3t": "Qué crear", "q3": "Acordes, Arpegio, Euclídeo, Bajo o Algorítmico: una pestaña cada uno.", "q4t": "Ajústalo", "q4": "Los ajustes del generador elegido. Cada cambio se ve al momento en la previsualización.", "q5t": "Previsualización", "q5": "Las notas que va a escribir, compás a compás. Variación prueba otra versión con los mismos ajustes.", "q6t": "Crea", "q6": "Crear lo escribe en la pista; Deshacer (o Cmd+Z en LUNA) lo quita."}, "ca": {"help": "Guia ràpida", "helpBtn": "Guia", "tNext": "Següent", "tBack": "Enrere", "tSkip": "Saltar", "tDone": "Entesos", "langT": "Tria el teu idioma", "langX": "La guia i tota la finestra el faran servir. El pots canviar després aquí, a dalt a la dreta.", "zt": "Sempre a mà", "z": "Torna a aquesta guia quan la necessitis amb el botó Guia.", "q1t": "On escriu", "q1": "Selecciona una pista d’instrument a LUNA i, si vols, un rang o loop. Tria si les notes substitueixen el que hi ha o s’hi afegeixen.", "q2t": "To i progressió", "q2": "Tria el to (o agafa’l de LUNA) i munta una progressió amb els acords, tria’n una de predefinida o segueix el regle d’acords de LUNA.", "q3t": "Què crear", "q3": "Acords, Arpegi, Euclidià, Baix o Algorítmic: una pestanya cadascun.", "q4t": "Ajusta’l", "q4": "Els ajustos del generador triat. Cada canvi es veu a l’instant a la previsualització.", "q5t": "Previsualització", "q5": "Les notes que escriurà, compàs a compàs. Variació prova una altra versió amb els mateixos ajustos.", "q6t": "Crea", "q6": "Crear ho escriu a la pista; Desfer (o Cmd+Z a LUNA) ho treu."}, "fr": {"help": "Guide rapide", "helpBtn": "Guide", "tNext": "Suivant", "tBack": "Retour", "tSkip": "Passer", "tDone": "Compris", "langT": "Choisissez votre langue", "langX": "Le guide et toute la fenêtre l’utiliseront. Vous pourrez la changer ici, en haut à droite.", "zt": "Toujours à portée", "z": "Rouvrez ce guide quand vous voulez avec le bouton Guide.", "q1t": "Où il écrit", "q1": "Sélectionnez une piste instrument dans LUNA et, si vous voulez, une zone ou une boucle. Choisissez si les notes remplacent l’existant ou s’y ajoutent.", "q2t": "Tonalité et progression", "q2": "Choisissez la tonalité (ou prenez celle de LUNA), puis construisez une progression avec les accords, choisissez un preset ou suivez la règle d’accords de LUNA.", "q3t": "Quoi créer", "q3": "Accords, Arpège, Euclidien, Basse ou Algorithmique : un onglet chacun.", "q4t": "Réglez-le", "q4": "Les réglages du générateur choisi. Chaque changement apparaît aussitôt dans l’aperçu.", "q5t": "Aperçu", "q5": "Les notes qu’il va écrire, mesure par mesure. Variation propose une autre version avec les mêmes réglages.", "q6t": "Créez", "q6": "Créer l’écrit sur la piste ; Annuler (ou Cmd+Z dans LUNA) le retire."}, "de": {"help": "Kurzanleitung", "helpBtn": "Anleitung", "tNext": "Weiter", "tBack": "Zurück", "tSkip": "Überspringen", "tDone": "Verstanden", "langT": "Wähle deine Sprache", "langX": "Die Anleitung und das ganze Fenster verwenden sie. Du kannst sie später hier oben rechts ändern.", "zt": "Immer zur Hand", "z": "Öffne diese Anleitung jederzeit wieder mit dem Button Anleitung.", "q1t": "Wohin es schreibt", "q1": "Wähle in LUNA eine Instrumentspur und, wenn du willst, einen Bereich oder Loop. Leg fest, ob die Noten das Vorhandene ersetzen oder dazukommen.", "q2t": "Tonart und Akkordfolge", "q2": "Wähl die Tonart (oder übernimm sie aus LUNA) und bau eine Folge aus den Akkorden, nimm eine Vorlage oder folge LUNAs Akkordlineal.", "q3t": "Was entsteht", "q3": "Akkorde, Arpeggio, Euklidisch, Bass oder Algorithmisch: je ein Tab.", "q4t": "Einstellen", "q4": "Die Einstellungen des gewählten Generators. Jede Änderung erscheint sofort in der Vorschau.", "q5t": "Vorschau", "q5": "Die Noten, die geschrieben werden, Takt für Takt. Variation würfelt eine neue Version mit denselben Einstellungen.", "q6t": "Erzeugen", "q6": "Erzeugen schreibt es auf die Spur; Rückgängig (oder Cmd+Z in LUNA) nimmt es zurück."}, "it": {"help": "Guida rapida", "helpBtn": "Guida", "tNext": "Avanti", "tBack": "Indietro", "tSkip": "Salta", "tDone": "Capito", "langT": "Scegli la tua lingua", "langX": "La guida e tutta la finestra la useranno. Puoi cambiarla poi qui, in alto a destra.", "zt": "Sempre a portata di mano", "z": "Riapri questa guida quando ti serve con il pulsante Guida.", "q1t": "Dove scrive", "q1": "Seleziona una traccia strumento in LUNA e, se vuoi, un intervallo o un loop. Scegli se le note sostituiscono ciò che c’è o si aggiungono.", "q2t": "Tonalità e progressione", "q2": "Scegli la tonalità (o prendila da LUNA), poi costruisci una progressione con gli accordi, scegline una pronta o segui il righello accordi di LUNA.", "q3t": "Cosa creare", "q3": "Accordi, Arpeggio, Euclideo, Basso o Algoritmico: una scheda ciascuno.", "q4t": "Regolalo", "q4": "Le impostazioni del generatore scelto. Ogni modifica si vede subito nell’anteprima.", "q5t": "Anteprima", "q5": "Le note che scriverà, battuta per battuta. Variazione prova un’altra versione con le stesse impostazioni.", "q6t": "Crea", "q6": "Crea lo scrive sulla traccia; Annulla (o Cmd+Z in LUNA) lo toglie."}, "pt": {"help": "Guia rápido", "helpBtn": "Guia", "tNext": "Seguinte", "tBack": "Voltar", "tSkip": "Saltar", "tDone": "Percebi", "langT": "Escolhe o teu idioma", "langX": "O guia e toda a janela vão usá-lo. Podes mudá-lo depois aqui, em cima à direita.", "zt": "Sempre à mão", "z": "Volta a este guia quando precisares com o botão Guia.", "q1t": "Onde escreve", "q1": "Seleciona uma faixa de instrumento no LUNA e, se quiseres, um intervalo ou loop. Escolhe se as notas substituem o que lá está ou se juntam.", "q2t": "Tom e progressão", "q2": "Escolhe o tom (ou tira-o do LUNA) e monta uma progressão com os acordes, escolhe uma predefinida ou segue a régua de acordes do LUNA.", "q3t": "O que criar", "q3": "Acordes, Arpejo, Euclidiano, Baixo ou Algorítmico: um separador cada.", "q4t": "Ajusta-o", "q4": "As definições do gerador escolhido. Cada mudança aparece logo na pré-visualização.", "q5t": "Pré-visualização", "q5": "As notas que vai escrever, compasso a compasso. Variação experimenta outra versão com as mesmas definições.", "q6t": "Cria", "q6": "Criar escreve-o na faixa; Desfazer (ou Cmd+Z no LUNA) retira-o."}})) Object.assign(I18N[c], v);
  let tour = null;
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';
  let color = COLORS.includes(store.get('color')) ? store.get('color') : 'purple';
  let statusTimer;
  const say = (key, vars = {}, kind = '', ms = 0) => { clearTimeout(statusTimer); $('status').textContent = key ? t(key, vars) : ''; $('status').className = `status ${kind}`; if (ms) statusTimer = setTimeout(() => say(null), ms); };
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 200) log.shift(); };
  const errText = (e) => String(e?.message || e);

  // ---- Settings ---------------------------------------------------------------------------------
  const KINDS = ['chords', 'arpeggio', 'euclidean', 'bass', 'algo'];
  const DEFAULTS = {
    chords: { voicing: 'close', rhythm: 'sustain', center: 60, vel: 90, gate: 95, push: false, bass: false },
    arpeggio: { mode: 'up', rate: '1/16', feel: 'n', octaves: 2, center: 60, vel: 88, gate: 80, accent: 12 },
    euclidean: { layer: 0, layers: [
      { on: true, steps: 16, pulses: 4, rotate: 0, rate: '1/16', source: 'note', note: 36, octave: 4, vel: 100, gate: 50 },
      { on: true, steps: 16, pulses: 2, rotate: 4, rate: '1/16', source: 'note', note: 38, octave: 4, vel: 95, gate: 50 },
      { on: false, steps: 16, pulses: 7, rotate: 0, rate: '1/16', source: 'note', note: 42, octave: 4, vel: 80, gate: 40 },
    ] },
    bass: { style: 'root', octave: 2, vel: 100, gate: 90 },
    algo: { method: 'fibMod', rate: '1/16', center: 60, vel: 92, gate: 85, chordBeats: true, terms: 6, pitchSrc: 'chord', offset: 0, rule: 90, cells: 16, start: 'random', lsys: 'fibonacci', iter: 7, r: 370, rests: 0, pattern: 'clapping', every: 1, tpos: 'above', contour: 'arch', noteSteps: 4, text: 'LUNA', digits: 'pi', collatz: 27, forms: 'all', fitScale: true },
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const saved = store.get('opts') ?? {};
  const opts = Object.fromEntries(KINDS.map((k) => [k, { ...clone(DEFAULTS[k]), ...(saved[k] ?? {}) }]));
  const prog = { key: 0, minor: false, src: 'mine', chords: ['C', 'G', 'Am', 'F'], len: 4, sev: false, span: 'sel', write: 'replace', seed: 1, ...(store.get('prog') ?? {}) };
  let kind = KINDS.includes(store.get('kind')) ? store.get('kind') : 'chords';
  const save = () => { store.set('opts', opts); store.set('prog', prog); store.set('kind', kind); };
  const ICON = {
    chords: '<rect x="3" y="4" width="14" height="3" rx="1"/><rect x="3" y="9" width="14" height="3" rx="1"/><rect x="3" y="14" width="14" height="3" rx="1"/>',
    arpeggio: '<path d="M3 16h3v-3h3v-3h3V7h3V4h2"/>',
    euclidean: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="3" r="1.6" fill="currentColor"/><circle cx="16.1" cy="13.5" r="1.6" fill="currentColor"/><circle cx="3.9" cy="13.5" r="1.6" fill="currentColor"/>',
    bass: '<path d="M4 15c3 0 4-10 8-10 2 0 3 2 3 4"/><circle cx="15" cy="12" r="2"/>',
    algo: '<path d="M10 10m-1.5 0a1.5 1.5 0 1 0 3 0a3 3 0 1 0-6 0a5 5 0 1 0 10 0a7 7 0 1 0-14 0"/>',
  };
  const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const noteName = (p) => `${NOTE_NAMES[((p % 12) + 12) % 12]}${Math.floor(p / 12) - 1}`;
  const GM = [[35, 'Kick 2'], [36, 'Kick'], [37, 'Side stick'], [38, 'Snare'], [39, 'Clap'], [40, 'Snare 2'], [41, 'Low floor tom'], [42, 'Closed hi-hat'], [43, 'Floor tom'], [44, 'Pedal hi-hat'], [45, 'Low tom'], [46, 'Open hi-hat'], [47, 'Mid tom'], [48, 'High-mid tom'], [49, 'Crash'], [50, 'High tom'], [51, 'Ride'], [52, 'China'], [53, 'Ride bell'], [54, 'Tambourine'], [55, 'Splash'], [56, 'Cowbell'], [57, 'Crash 2'], [59, 'Ride 2'], [60, 'High bongo'], [61, 'Low bongo'], [62, 'Mute conga'], [63, 'Open conga'], [64, 'Low conga'], [69, 'Cabasa'], [70, 'Maracas'], [75, 'Claves'], [76, 'High wood block'], [77, 'Low wood block']];

  function knob(label, value, min, max, fmt, onSet, def, step = 1) {
    const box = document.createElement('div'); box.className = 'knob';
    box.innerHTML = '<div class="kl"></div><svg viewBox="0 0 40 40"></svg><div class="kv"></div>';
    box.querySelector('.kl').textContent = label;
    const svg = box.querySelector('svg'), kv = box.querySelector('.kv');
    const pt = (deg, r) => { const rad = (deg - 90) * Math.PI / 180; return [20 + r * Math.cos(rad), 20 + r * Math.sin(rad)]; };
    const arc = (from, to) => { const [x1, y1] = pt(from, 15), [x2, y2] = pt(to, 15); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A15 15 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
    const zero = min < 0 && max > 0 ? -135 + ((0 - min) / (max - min)) * 270 : -135;
    const paint = () => {
      const frac = (value - min) / (max - min || 1), a = -135 + frac * 270, [px, py] = pt(a, 10);
      const lo = Math.min(zero, a), hi = Math.max(zero, a);
      svg.innerHTML = `<path d="${arc(-135, 135)}" class="ktrack"/>${hi - lo > 0.5 ? `<path d="${arc(lo, hi)}" class="kval"/>` : ''}<line x1="20" y1="20" x2="${px.toFixed(2)}" y2="${py.toFixed(2)}" class="kptr"/>`;
      kv.textContent = fmt(value);
    };
    const set = (v) => { v = Math.max(min, Math.min(max, Math.round(v / step) * step)); if (v === value) return; value = v; paint(); onSet(v); };
    svg.onpointerdown = (ev) => {
      svg.setPointerCapture(ev.pointerId);
      const y0 = ev.clientY, v0 = value, span = max - min;
      svg.onpointermove = (e) => set(v0 + ((y0 - e.clientY) / 160) * span);
      svg.onpointerup = () => { svg.onpointermove = null; svg.onpointerup = null; };
    };
    svg.onwheel = (ev) => { ev.preventDefault(); set(value + (ev.deltaY < 0 ? 1 : -1) * Math.max(step, Math.round((max - min) / 100 / step) * step)); };
    svg.ondblclick = () => set(def);
    paint();
    return box;
  }
  function seg(items, cur, onPick, cls = '') {
    const box = document.createElement('div'); box.className = `seg ${cls}`;
    for (const [v, label] of items) {
      const b = Object.assign(document.createElement('button'), { textContent: label });
      b.classList.toggle('on', v === cur);
      b.onclick = () => { onPick(v); changed(); paintParams(); };
      box.append(b);
    }
    return box;
  }
  const fillSeg = (el, items, cur, onPick) => { const s = seg(items, cur, onPick); el.replaceChildren(...s.childNodes); };
  function row(label, ...kids) {
    const r = document.createElement('div'); r.className = 'prow';
    if (label) r.append(Object.assign(document.createElement('label'), { textContent: label }));
    r.append(...kids);
    return r;
  }
  const knobs = (...k) => { const r = document.createElement('div'); r.className = 'knobrow'; r.append(...k); return r; };
  const hint = (k) => Object.assign(document.createElement('div'), { className: 'hint', textContent: t(k) });
  const check = (k, on, onSet) => {
    const l = document.createElement('label'); l.className = 'check';
    l.innerHTML = '<input type="checkbox"><span></span>';
    l.querySelector('input').checked = on;
    l.querySelector('input').onchange = (e) => { onSet(e.target.checked); changed(); paintParams(); };
    l.querySelector('span').textContent = t(k);
    return l;
  };
  const select = (items, cur, onSet) => {
    const s = document.createElement('select');
    s.replaceChildren(...items.map(([v, l]) => Object.assign(document.createElement('option'), { value: String(v), textContent: l })));
    s.value = String(cur);
    s.onchange = () => { onSet(s.value); changed(); };
    return s;
  };
  const GRIDS = ['1/4', '1/8', '1/16', '1/32'];

  let redraw = () => {};
  let relabel = () => {};
  let readKey = () => false;
  const changed = () => { save(); redraw(); };

  function paintParams() {
    const o = opts[kind];
    const set = (k) => (v) => { o[k] = v; changed(); };
    const pct = (v) => `${v}%`;
    const kids = [];
    if (kind === 'chords') {
      kids.push(row(t('voicing'), seg([['close', t('vClose')], ['open', t('vOpen')], ['drop2', t('vDrop2')], ['wide', t('vWide')]], o.voicing, (v) => { o.voicing = v; })));
      kids.push(row(t('rhythm'), select([['sustain', t('rSustain')], ['half', t('rHalf')], ['quarter', t('rQuarter')], ['eighths', t('rEighths')], ['charleston', t('rCharleston')], ['tresillo', t('rTresillo')], ['offbeat', t('rOffbeat')], ['pop', t('rPop')]], o.rhythm, (v) => { o.rhythm = v; })));
      kids.push(knobs(knob(t('register'), o.center, 48, 76, noteName, set('center'), 60), knob(t('vel'), o.vel, 1, 127, String, set('vel'), 90), knob(t('gate'), o.gate, 10, 100, pct, set('gate'), 95, 5)));
      kids.push(check('push', o.push, (v) => { o.push = v; }), check('addBass', o.bass, (v) => { o.bass = v; }));
    } else if (kind === 'arpeggio') {
      kids.push(row(t('mode'), seg([['up', t('aUp')], ['down', t('aDown')], ['updown', t('aUpDown')], ['downup', t('aDownUp')], ['converge', t('aConverge')], ['pedal', t('aPedal')], ['random', t('aRandom')]], o.mode, (v) => { o.mode = v; }, 'grid3')));
      kids.push(row(t('rate'), seg(GRIDS.map((g) => [g, g]), o.rate, (v) => { o.rate = v; })));
      kids.push(row(t('feel'), seg([['n', t('feelN')], ['t', t('feelT')], ['d', t('feelD')]], o.feel, (v) => { o.feel = v; })));
      kids.push(knobs(knob(t('octaves'), o.octaves, 1, 4, String, set('octaves'), 2), knob(t('register'), o.center, 36, 76, noteName, set('center'), 60), knob(t('gate'), o.gate, 10, 100, pct, set('gate'), 80, 5), knob(t('accent'), o.accent, 0, 40, (v) => `+${v}`, set('accent'), 12)));
    } else if (kind === 'euclidean') {
      const li = o.layer ?? 0, L = o.layers[li];
      const lay = document.createElement('div'); lay.className = 'layers';
      lay.append(seg(o.layers.map((x, i) => [i, `${x.on ? '●' : '○'} ${t('layer', { n: i + 1 })}`]), li, (v) => { o.layer = v; }), check('on', L.on, (v) => { L.on = v; }));
      kids.push(lay);
      const lset = (k) => (v) => { L[k] = v; if (k === 'steps') { L.pulses = Math.min(L.pulses, v); L.rotate = Math.min(L.rotate, v - 1); paintParams(); } changed(); };
      kids.push(knobs(knob(t('steps'), L.steps, 2, 32, String, lset('steps'), 16), knob(t('pulses'), L.pulses, 0, L.steps, String, lset('pulses'), 4), knob(t('rotate'), L.rotate, 0, L.steps - 1, String, lset('rotate'), 0), knob(t('vel'), L.vel, 1, 127, String, lset('vel'), 100)));
      kids.push(row(t('rate'), seg(GRIDS.map((g) => [g, g]), L.rate, (v) => { L.rate = v; })));
      kids.push(row(t('source'), seg([['note', t('sNote')], ['root', t('sRoot')], ['chord', t('sChord')], ['scale', t('sScale')]], L.source, (v) => { L.source = v; }, 'grid2')));
      if (L.source === 'note') {
        const items = [...GM.map(([n, name]) => [n, `${n} · ${name}`]), ...Array.from({ length: 61 }, (_, i) => [24 + i, noteName(24 + i)]).filter(([n]) => !GM.some(([g]) => g === n))].sort((a, b) => a[0] - b[0]);
        kids.push(row(t('note'), select(items, L.note, (v) => { L.note = Number(v); })));
      } else kids.push(knobs(knob(t('octave'), L.octave, 1, 6, String, lset('octave'), 4)));
      kids.push(hint('eucHint'));
    } else if (kind === 'bass') {
      kids.push(row(t('style'), seg([['root', t('bRoot')], ['pulse', t('bPulse')], ['octaves', t('bOctaves')], ['rootFifth', t('bRootFifth')], ['arp', t('bArp')], ['pop', t('bPop')], ['walking', t('bWalking')]], o.style, (v) => { o.style = v; }, 'grid3')));
      kids.push(knobs(knob(t('octave'), o.octave, 0, 3, String, set('octave'), 2), knob(t('vel'), o.vel, 1, 127, String, set('vel'), 100), knob(t('gate'), o.gate, 10, 100, pct, set('gate'), 90, 5)));
    } else if (kind === 'algo') {
      // The method, grouped by family, with a line on what it does.
      const sel = document.createElement('select');
      for (const [g, ms] of [['gFib', ['fibDur', 'fibMod', 'fibWord']], ['gSys', ['cellular', 'lsystem', 'logistic']], ['gComp', ['phasing', 'tinti', 'serial']], ['gFun', ['text', 'digits']]]) {
        const og = document.createElement('optgroup'); og.label = t(g);
        og.append(...ms.map((x) => Object.assign(document.createElement('option'), { value: x, textContent: t(`m_${x}`) })));
        sel.append(og);
      }
      sel.value = o.method;
      sel.onchange = () => { o.method = sel.value; changed(); paintParams(); };
      kids.push(row(t('method'), sel), hint(`h_${o.method}`));
      const src = (cur) => seg([['chord', t('sChord')], ['scale', t('sScale')]], cur, (v) => { o.pitchSrc = v; });
      const mk = [];
      if (o.method === 'fibDur') { kids.push(row(t('source'), src(o.pitchSrc))); mk.push(knob(t('terms'), o.terms, 3, 8, (v) => String([1, 1, 2, 3, 5, 8, 13, 21][v - 1]), set('terms'), 6)); }
      else if (o.method === 'fibMod') mk.push(knob(t('offset'), o.offset, 0, 15, String, set('offset'), 0));
      else if (o.method === 'fibWord') kids.push(row(t('source'), src(o.pitchSrc)));
      else if (o.method === 'cellular') {
        kids.push(row(t('rule'), seg([30, 45, 73, 90, 110, 150].map((x) => [x, String(x)]), o.rule, (v) => { o.rule = v; })));
        kids.push(row(t('startRow'), seg([['center', t('stCenter')], ['random', t('stRandom')]], o.start, (v) => { o.start = v; })), row(t('source'), src(o.pitchSrc)));
        mk.push(knob(t('cells'), o.cells, 4, 32, String, set('cells'), 16));
      } else if (o.method === 'lsystem') {
        kids.push(row(t('grammar'), seg([['fibonacci', 'Fibonacci'], ['cantor', 'Cantor'], ['koch', 'Koch'], ['dragon', t('dragon')]], o.lsys, (v) => { o.lsys = v; })));
        mk.push(knob(t('iter'), o.iter, 1, 9, String, set('iter'), 7));
      } else if (o.method === 'logistic') mk.push(knob(t('chaos'), o.r, 250, 400, (v) => (v / 100).toFixed(2), set('r'), 370), knob(t('rests'), o.rests, 0, 80, pct, set('rests'), 0, 5));
      else if (o.method === 'phasing') {
        kids.push(row(t('pattern'), seg([['clapping', 'Clapping'], ['bembe', 'Bembé'], ['son', 'Son 3-2'], ['tresillo', 'Tresillo']], o.pattern, (v) => { o.pattern = v; })));
        kids.push(row(t('shiftEvery'), seg([[1, t('bar1')], [2, t('bars', { n: 2 })], [4, t('bars', { n: 4 })]], o.every, (v) => { o.every = v; })));
      } else if (o.method === 'tinti') {
        kids.push(row(t('tpos'), seg([['above', t('tAbove')], ['below', t('tBelow')], ['alt', t('tAlt')]], o.tpos, (v) => { o.tpos = v; })));
        kids.push(row(t('contour'), seg([['up', t('cUp')], ['down', t('cDown')], ['arch', t('cArch')]], o.contour, (v) => { o.contour = v; })));
        mk.push(knob(t('noteLen'), o.noteSteps, 1, 16, String, set('noteSteps'), 4));
      } else if (o.method === 'serial') {
        kids.push(row(t('forms'), seg([['all', t('fAll')], ['P', 'P'], ['I', 'I'], ['R', 'R'], ['RI', 'RI']], o.forms, (v) => { o.forms = v; })));
        kids.push(check('fitScale', o.fitScale, (v) => { o.fitScale = v; }));
      } else if (o.method === 'text') {
        const inp = document.createElement('input'); inp.id = 'algoText'; inp.value = o.text; inp.maxLength = 40; inp.spellcheck = false;
        inp.oninput = () => { o.text = inp.value; changed(); };
        inp.onkeydown = (ev) => ev.stopPropagation();
        kids.push(row(t('textLbl'), inp));
      } else if (o.method === 'digits') {
        kids.push(row(t('numbers'), seg([['pi', 'π'], ['e', 'e'], ['phi', 'φ'], ['primes', t('primes')], ['collatz', 'Collatz']], o.digits, (v) => { o.digits = v; })));
        if (o.digits === 'collatz') mk.push(knob(t('startN'), o.collatz, 2, 99, String, set('collatz'), 27));
      }
      kids.push(row(t('rate'), seg(GRIDS.map((g) => [g, g]), o.rate, (v) => { o.rate = v; })));
      kids.push(knobs(...mk, knob(t('register'), o.center, 36, 84, noteName, set('center'), 60), knob(t('vel'), o.vel, 1, 127, String, set('vel'), 92), knob(t('gate'), o.gate, 10, 100, pct, set('gate'), 85, 5)));
      if (['fibMod', 'lsystem', 'logistic', 'text', 'digits'].includes(o.method) || (['fibDur', 'fibWord', 'cellular'].includes(o.method) && o.pitchSrc === 'scale')) kids.push(check('chordBeats', o.chordBeats, (v) => { o.chordBeats = v; }));
    }
    $('params').replaceChildren(...kids);
  }

  function paintTabs() {
    $('tabs').replaceChildren(...KINDS.map((k) => {
      const b = document.createElement('button');
      b.className = k === kind ? 'on' : '';
      b.innerHTML = `<svg viewBox="0 0 20 20">${ICON[k]}</svg><span></span>`;
      b.querySelector('span').textContent = t(k);
      b.onclick = () => { kind = k; save(); paintTabs(); paintParams(); redraw(); };
      return b;
    }));
    $('create').textContent = t('createWhat', { what: t(kind) });
  }

  // ---- Progression strip --------------------------------------------------------------------------
  let rulerList = () => [];
  function paintProg() {
    const names = prog.minor ? T.KEY_NAMES_MIN : T.KEY_NAMES_MAJ;
    $('key').replaceChildren(...names.map((n, i) => Object.assign(document.createElement('option'), { value: String(i), textContent: n })));
    $('key').value = String(prog.key);
    fillSeg($('kmode'), [[false, t('major')], [true, t('minor')]], prog.minor, (v) => { prog.minor = v; paintProg(); });
    fillSeg($('psrc'), [['mine', t('mine')], ['ruler', t('ruler')]], prog.src, (v) => { prog.src = v; paintProg(); });
    $('mineRow').hidden = prog.src !== 'mine';
    $('preset').hidden = prog.src !== 'mine';
    const chips = [];
    if (prog.src === 'ruler') {
      const list = rulerList();
      if (!list.length) chips.push(Object.assign(document.createElement('span'), { className: 'none', textContent: t('emptyRuler') }));
      for (const c of list) chips.push(Object.assign(document.createElement('span'), { className: 'chip ruler', textContent: c.name }));
    } else {
      if (!prog.chords.length) chips.push(Object.assign(document.createElement('span'), { className: 'none', textContent: t('emptyProg') }));
      prog.chords.forEach((name, i) => {
        const c = document.createElement('span'); c.className = 'chip';
        c.innerHTML = '<i></i><span></span><b>×</b>';
        c.querySelector('i').textContent = String(i + 1);
        c.querySelector('span').textContent = name;
        c.querySelector('b').onclick = () => { prog.chords.splice(i, 1); changed(); paintProg(); };
        chips.push(c);
      });
      if (prog.chords.length) {
        const x = Object.assign(document.createElement('button'), { className: 'btn', textContent: t('clear') });
        x.onclick = () => { prog.chords = []; changed(); paintProg(); };
        chips.push(x);
      }
    }
    $('chips').replaceChildren(...chips);
    const kc = T.keyChords(prog.key, prog.minor, prog.sev);
    $('degs').replaceChildren(...[...kc.diatonic.map((d) => [d, false]), ...kc.borrowed.map((d) => [d, true])].map(([d, bor]) => {
      const b = document.createElement('button'); b.className = `deg${bor ? ' bor' : ''}`;
      b.innerHTML = '<span></span><em></em>';
      b.querySelector('span').textContent = d.name; b.querySelector('em').textContent = d.roman;
      b.onclick = () => { prog.chords.push(d.name); if (prog.chords.length > 16) prog.chords.shift(); changed(); paintProg(); };
      return b;
    }));
    const ids = Object.keys(G.PRESETS).filter((id) => G.PRESETS[id].minor === prog.minor);
    $('preset').replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: t('preset') }), ...ids.map((id) => Object.assign(document.createElement('option'), { value: id, textContent: t(id) })));
    $('preset').value = '';
    fillSeg($('clen'), [[8, t('len2')], [4, t('len1')], [2, t('lenH')]], prog.len, (v) => { prog.len = v; paintProg(); });
    $('sev').checked = prog.sev;
    redraw();
  }
  $('key').onchange = () => { prog.key = Number($('key').value); changed(); paintProg(); };
  $('preset').onchange = () => { const id = $('preset').value; if (!id) return; prog.chords = G.presetNames(id, prog.key, prog.minor, prog.sev); if (id === 'blues') prog.len = 4; changed(); paintProg(); };
  $('sev').onchange = () => { prog.sev = $('sev').checked; changed(); paintProg(); };
  $('keyLuna').onclick = () => { if (readKey(false)) paintProg(); };

  const closeColors = () => { $('colorMenu').hidden = true; $('colorBtn').classList.remove('open'); };
  function paintStatic() {
    document.documentElement.lang = lang;
    $('help').title = t('help'); $('help').setAttribute('aria-label', t('help')); { const q = document.createElement('b'); q.textContent = '?'; const sp = document.createElement('span'); sp.textContent = t('helpBtn'); $('help').replaceChildren(q, sp); }
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.color = color;
    $('ver').textContent = `v${VERSION}`;
    $('lang').replaceChildren(...Object.keys(I18N).map((c) => Object.assign(document.createElement('option'), { value: c, textContent: I18N[c]._name })));
    $('lang').value = lang;
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); }
    $('colorBtn').title = t('color'); $('colorBtn').setAttribute('aria-label', t('color'));
    $('colorMenu').replaceChildren(...COLORS.map((c) => {
      const b = document.createElement('button');
      b.className = c === color ? 'on' : '';
      b.innerHTML = `<i class="sw" data-color="${c}" data-theme="${theme}"></i><span></span><svg viewBox="0 0 12 12"><path d="M2.5 6.5L5 9L9.5 3.5"/></svg>`;
      b.querySelector('span').textContent = t(`c${c[0].toUpperCase()}${c.slice(1)}`);
      b.onclick = () => { color = c; store.set('color', c); closeColors(); paintStatic(); };
      return b;
    }));
    $('keyLbl').textContent = t('key'); $('keyLuna').textContent = t('fromLuna'); $('sevLbl').textContent = t('sevenths');
    $('undo').textContent = t('undo');
    $('dice').innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" style="display:inline-block;vertical-align:-3px;margin-right:6px"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>${t('dice')}`;
    fillSeg($('span'), [['sel', t('spanSel')], ['1', '1'], ['2', '2'], ['4', '4'], ['8', '8']], prog.span, (v) => { prog.span = v; relabel(); });
    fillSeg($('wmode'), [['replace', t('replace')], ['add', t('add')]], prog.write, (v) => { prog.write = v; });
    paintTabs(); paintParams(); paintProg(); relabel();
  }
  // The segs wire their own clicks through fillSeg, which repaints only the parameters; the strip's
  // own segs need their own repaint, done in their callbacks above.
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  $('colorBtn').onclick = (ev) => { ev.stopPropagation(); const open = $('colorMenu').hidden; $('colorMenu').hidden = !open; $('colorBtn').classList.toggle('open', open); };
  document.addEventListener('mousedown', (ev) => { if (!ev.target.closest?.('.colors')) closeColors(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeColors(); });
  $('dice').onclick = () => { prog.seed = 1 + Math.floor(Math.random() * 99999); changed(); };
  paintStatic();

  let luna, built;
  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    if (!s) { say('noSession'); return; }
    await s.ready();
    if (s !== built) return;
    await s.musical.ready().catch(() => undefined);
    say(null);
    const ctx = s.context, tr = s.transport, tl = s.musical.timeline;
    const TPB = Luna.TICKS_PER_BEAT;
    G.setTPB(TPB);
    let busy = false, undoSteps = 0;

    const isMidiTrack = (x) => x && ['instrument', 'midi_matrix'].includes(x.trackType?.value);
    const track = () => {
      const ids = ctx.selectionTracks.value ?? [];
      return ids.map((id) => s.tracks.byId(id)).find(isMidiTrack) ?? (isMidiTrack(s.tracks.byId(ctx.lastSelectedTrack.value)) ? s.tracks.byId(ctx.lastSelectedTrack.value) : null);
    };
    const barOf = (tick) => { try { return tl.barBeat(tick).bar; } catch { return Math.floor(tick / (4 * TPB)) + 1; } };
    const tickAtBar = (bar) => { try { return tl.tickAtBar(bar); } catch { return (bar - 1) * 4 * TPB; } };
    // Where to write: the selection (or the loop), or a number of bars from the bar where the
    // selection or the cursor is.
    function span() {
      const S = ctx.selectionStart.value, E = ctx.selectionStop.value;
      const hasSel = typeof S === 'number' && typeof E === 'number' && E > S;
      if (prog.span === 'sel') {
        if (hasSel) return { S, E, how: 'sel' };
        const ls = tr.loopStart?.value, le = tr.loopStop?.value;
        if (typeof ls === 'number' && typeof le === 'number' && le > ls) return { S: ls, E: le, how: 'loop' };
      }
      const from = hasSel ? S : (typeof S === 'number' ? S : tr.playStart?.value ?? 0);
      const bar = barOf(from);
      const n = prog.span === 'sel' ? 4 : Number(prog.span);
      return { S: tickAtBar(bar), E: tickAtBar(bar + n), how: 'bars', n };
    }
    function barsIn(S, E) {
      const out = [];
      for (let b = barOf(S); ; b++) {
        const a = tickAtBar(b), z = tickAtBar(b + 1);
        if (a >= E || out.length > 512) break;
        out.push({ start: a, beats: Math.max(1, Math.round((z - a) / TPB)) });
      }
      return out;
    }
    rulerList = () => {
      const { S, E } = span();
      const all = (s.musical.chords?.sorted ?? []).filter((c) => T.parseChord(c.name.value));
      const inside = all.filter((c) => c.location.value >= S && c.location.value < E);
      const before = all.filter((c) => c.location.value < S).pop();
      return [...(before ? [{ tick: S, name: before.name.value }] : []), ...inside.map((c) => ({ tick: c.location.value, name: c.name.value }))];
    };
    function segments(S, E) {
      if (prog.src === 'ruler') return G.fromRuler(rulerList().map((c) => ({ tick: c.tick, chord: T.parseChord(c.name) })), S, E);
      return G.lay(prog.chords.map((n) => T.parseChord(n)).filter(Boolean), prog.len, S, E);
    }
    function build1() {
      const { S, E } = span();
      const segs = segments(S, E);
      const bars = barsIn(S, E);
      const o = { ...opts[kind], seed: prog.seed };
      const notes = segs.length ? G.generate(kind, segs, bars, S, E, o, { pc: prog.key, minor: prog.minor }) : [];
      return { S, E, segs, bars, notes: notes.filter((n) => n.start >= S && n.start < E).map((n) => ({ ...n, stop: Math.min(n.stop, E) })) };
    }

    readKey = (quiet) => {
      const { S } = span();
      const k = s.musical.keySignatureAt?.(S) ?? s.musical.keySignatures?.items?.[0];
      if (!k || typeof k.sharpsAndFlats?.value !== 'number') { if (!quiet) say('noKeyLuna', {}, 'bad', 5000); return false; }
      prog.minor = !!k.isMinor?.value;
      prog.key = T.keyFromSignature(k.sharpsAndFlats.value, prog.minor);
      changed();
      return true;
    };
    if (!store.get('prog')) { if (readKey(true)) prog.chords = G.presetNames(prog.minor ? 'minorPop' : 'pop', prog.key, prog.minor, false); save(); }

    relabel = () => {
      const tk = track();
      $('target').classList.toggle('has', !!tk);
      if (!tk) { $('tMain').textContent = t('noTrack'); $('tSub').textContent = t('noTrackSub'); }
      else {
        const sp = span();
        $('tMain').textContent = tk.name.value;
        const a = barOf(sp.S), b = barOf(sp.E - 1);
        $('tSub').textContent = sp.how === 'sel' ? t('rangeSel', { a, b }) : sp.how === 'loop' ? t('rangeLoop', { a, b }) : t('rangeFrom', { n: sp.n, a });
      }
      $('create').disabled = busy || !tk;
      $('undo').disabled = busy || !undoSteps;
      if (prog.src === 'ruler') paintProg(); else redraw();
    };

    // ---- Preview --------------------------------------------------------------------------------------
    redraw = () => {
      const svg = $('roll');
      const W = Math.max(200, svg.clientWidth || 400), H = Math.max(120, svg.clientHeight || 220);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      $('pTitle').textContent = `${t('preview')} · ${t(kind)}`;
      const { S, E, segs, bars, notes } = build1();
      if (!segs.length) { svg.innerHTML = `<text class="empty" x="${W / 2}" y="${H / 2}">${t(prog.src === 'ruler' ? 'emptyRuler' : 'noChords')}</text>`; return; }
      const X = (tk) => ((tk - S) / (E - S)) * W;
      const top = 20;
      let lo = notes.length ? Math.min(...notes.map((n) => n.pitch)) - 2 : 48, hi = notes.length ? Math.max(...notes.map((n) => n.pitch)) + 2 : 72;
      if (hi - lo < 14) { const m = (hi + lo) / 2; lo = Math.floor(m - 7); hi = Math.ceil(m + 7); }
      const rowH = (H - top - 2) / (hi - lo + 1);
      const Y = (p) => top + (hi - p) * rowH;
      const parts = [];
      segs.forEach((g, i) => {
        if (i % 2) parts.push(`<rect class="cb" x="${X(g.start).toFixed(1)}" y="0" width="${(X(g.stop) - X(g.start)).toFixed(1)}" height="${H}"/>`);
        if (X(g.stop) - X(g.start) > 18) parts.push(`<text class="cn" x="${(X(g.start) + 4).toFixed(1)}" y="14">${g.chord.name}</text>`);
      });
      for (const b of bars) {
        for (let k = 0; k < b.beats; k++) { const x = b.start + k * TPB; if (x > S && x < E) parts.push(`<line class="${k ? 'gl' : 'bl'}" x1="${X(x).toFixed(1)}" x2="${X(x).toFixed(1)}" y1="${top}" y2="${H}"/>`); }
      }
      for (let p = lo; p <= hi; p++) if (p % 12 === 0) parts.push(`<text class="pl" x="3" y="${(Y(p) + rowH - 2).toFixed(1)}">C${Math.floor(p / 12) - 1}</text>`);
      const h = Math.max(2.5, rowH - 1.2);
      for (const n of notes) parts.push(`<rect class="new" fill="url(#ngrad)" fill-opacity="${(0.4 + 0.6 * n.velocity / 127).toFixed(2)}" x="${X(n.start).toFixed(1)}" y="${(Y(n.pitch) + 0.6).toFixed(1)}" width="${Math.max(1.5, X(n.stop) - X(n.start) - 0.5).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"/>`);
      svg.innerHTML = parts.join('');
    };
    new ResizeObserver(() => redraw()).observe($('roll'));

    // ---- Writing --------------------------------------------------------------------------------------
    async function writeNotes(tk, S, E, notes) {
      const lane = s.playlistFor(tk);
      await lane.clips.load();
      let over = lane.clips.items.filter((c) => c.stop.value > S && c.start.value < E);
      // A clip that starts before the range and stops inside it, with nothing else in the way, grows.
      if (over.length === 1 && over[0].start.value <= S && over[0].stop.value < E && over[0].clipType?.value === 'midi') {
        await over[0].trim(over[0].start.value, E).catch((e) => note('extend failed', { e: errText(e) }));
        undoSteps++;
      }
      if (!over.length) {
        const before = lane.clips.items.find((c) => c.stop.value === S && c.clipType?.value === 'midi');
        if (before) { await before.trim(before.start.value, E).catch((e) => note('extend failed', { e: errText(e) })); undoSteps++; }
      }
      await lane.clips.load();
      over = lane.clips.items.filter((c) => c.stop.value > S && c.start.value < E);
      if (!over.length) {
        await lane.createNotes(notes.map((n) => ({ pitch: n.pitch, startTick: n.start, stopTick: Math.max(n.start + 1, n.stop), velocity: n.velocity })));
        undoSteps++;
        return;
      }
      const clip = over.length === 1 && over[0].start.value <= S && over[0].stop.value >= E ? over[0] : null;
      if (!clip) throw new Error(t('partial'));
      await clip.midi.ready();
      const c0 = clip.start.value, len = clip.stop.value - c0;
      await s.transaction(`MIDI Creator: ${t(kind)}`, async () => {
        if (prog.write === 'replace') {
          const old = clip.midi.notes.items.filter((n) => c0 + n.startTick >= S && c0 + n.startTick < E);
          if (old.length) await clip.midi.deleteNotes(old);
        }
        await clip.addNotes(notes.map((n) => {
          const tick = Math.max(0, n.start - c0);
          return { pitch: n.pitch, tick, lengthTicks: Math.max(1, Math.min(len, n.stop - c0) - tick), velocity: n.velocity, channel: 0 };
        }));
      });
      undoSteps++;
      await clip.midi.refresh().catch(() => undefined);
    }
    async function create() {
      if (busy) return;
      const tk = track();
      if (!tk) return;
      const { S, E, segs, notes } = build1();
      if (!segs.length || !notes.length) { say('noChords', {}, 'bad', 4000); return; }
      busy = true; relabel(); say('working');
      undoSteps = 0;
      try {
        await writeNotes(tk, S, E, notes);
        note('create', { kind, opts: opts[kind], prog: { ...prog }, S, E, notes: notes.length });
        say('created', { what: t(kind), n: notes.length, track: tk.name.value }, 'ok', 5000);
      } catch (e) {
        note('create failed', { kind, e: errText(e) });
        say('failed', { e: errText(e) }, 'bad', 8000);
      }
      busy = false; relabel();
    }
    $('create').onclick = () => void create();
    $('undo').onclick = async () => {
      if (!undoSteps || busy) return;
      try { await s.undo(undoSteps); undoSteps = 0; say('undone', {}, 'ok', 3000); } catch (e) { say('failed', { e: errText(e) }, 'bad', 6000); }
      relabel();
    };
    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const sp = span();
      const text = JSON.stringify({ version: VERSION, kind, opts: opts[kind], prog, span: sp, track: track()?.name.value, ruler: rulerList(), log }, null, 2);
      try { if (await AddOnCopy(text)) say('report', {}, 'ok', 5000); } catch { /* nothing */ }
    };
    for (const p of [ctx.selectionStart, ctx.selectionStop, ctx.selectionTracks, ctx.lastSelectedTrack, tr.loopStart, tr.loopStop, tr.playStart]) p?.onChange?.(() => relabel());
    s.musical.chords?.onChange?.(() => { if (prog.src === 'ruler') paintProg(); });
    tl.onChange?.(() => redraw());
    paintProg(); relabel();
  }

  (async () => {
    for (;;) {
      try { luna = await Luna.connect(); break; }
      catch { say('waiting'); await new Promise((r) => setTimeout(r, 1500)); }
    }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
    tour ??= window.AddOnTour?.attach({
      button: $('help'), key: `${KEY}tourSeen`,
      labels: () => ({ next: t('tNext'), back: t('tBack'), skip: t('tSkip'), done: t('tDone') }),
      language: {
        sel: '#lang',
        list: () => Object.keys(I18N).map((c) => [c, I18N[c]._name]),
        current: () => lang,
        set: (c) => { $('lang').value = c; $('lang').dispatchEvent(new Event('change')); },
        title: () => t('langT'), text: () => t('langX'),
      },
      steps: () => [
        { sel: '#target', title: () => t('q1t'), text: () => t('q1') },
        { sel: '#prog', title: () => t('q2t'), text: () => t('q2') },
        { sel: '#tabs', title: () => t('q3t'), text: () => t('q3') },
        { sel: '#params', title: () => t('q4t'), text: () => t('q4') },
        { sel: '#preview', title: () => t('q5t'), text: () => t('q5') },
        { sel: '.actions', title: () => t('q6t'), text: () => t('q6') },
        { sel: '#help', title: () => t('zt'), text: () => t('z') },
      ],
    });
  })();
})();
