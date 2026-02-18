export type Mode =
  | 'hex-to-dec'
  | 'hex-to-oct'
  | 'hex-to-bin'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'random';

export interface AnswerOption {
  id: number;
  label: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  display: string;
  mode: Mode;
  correct: string;
  options: AnswerOption[];
}

// ── HELPERS ──
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeOptions(correct: string, genWrong: () => string): AnswerOption[] {
  const set = new Set([correct]);
  const wrongs: string[] = [];
  let attempts = 0;
  while (wrongs.length < 3 && attempts < 100) {
    attempts++;
    const w = genWrong();
    if (!set.has(w)) { set.add(w); wrongs.push(w); }
  }
  return shuffle([correct, ...wrongs]).map((label, i) => ({
    id: i,
    label,
    isCorrect: label === correct,
  }));
}

// ── ГЕНЕРАТОРЫ ──
function genHexToDec(): Question {
  const n = randInt(1, 255);
  const hex = n.toString(16).toUpperCase();
  const correct = String(n);
  return {
    id: Date.now(),
    display: `${hex}(16) = ?(10)`,
    mode: 'hex-to-dec',
    correct,
    options: makeOptions(correct, () => String(randInt(1, 255))),
  };
}

function genHexToOct(): Question {
  const n = randInt(1, 255);
  const hex = n.toString(16).toUpperCase();
  const correct = n.toString(8);
  return {
    id: Date.now(),
    display: `${hex}(16) = ?(8)`,
    mode: 'hex-to-oct',
    correct,
    options: makeOptions(correct, () => randInt(1, 255).toString(8)),
  };
}

function genHexToBin(): Question {
  const n = randInt(1, 255);
  const hex = n.toString(16).toUpperCase();
  const correct = hex.split('').map(c =>
    parseInt(c, 16).toString(2).padStart(4, '0')
  ).join(' ');
  return {
    id: Date.now(),
    display: `${hex}(16) = ?(2)`,
    mode: 'hex-to-bin',
    correct,
    options: makeOptions(correct, () => {
      const r = randInt(1, 255);
      return r.toString(16).toUpperCase().split('').map(c =>
        parseInt(c, 16).toString(2).padStart(4, '0')
      ).join(' ');
    }),
  };
}

function genAddition(): Question {
  const a = randInt(1, 127);
  const b = randInt(1, 127);
  const correct = (a + b).toString(16).toUpperCase();
  return {
    id: Date.now(),
    display: `${a.toString(16).toUpperCase()} + ${b.toString(16).toUpperCase()} = ?(16)`,
    mode: 'addition',
    correct,
    options: makeOptions(correct, () => randInt(2, 254).toString(16).toUpperCase()),
  };
}

function genSubtraction(): Question {
  const a = randInt(16, 255);
  const b = randInt(1, a - 1);
  const correct = (a - b).toString(16).toUpperCase();
  return {
    id: Date.now(),
    display: `${a.toString(16).toUpperCase()} − ${b.toString(16).toUpperCase()} = ?(16)`,
    mode: 'subtraction',
    correct,
    options: makeOptions(correct, () => randInt(1, 254).toString(16).toUpperCase()),
  };
}

function genMultiplication(): Question {
  const a = randInt(2, 15);
  const b = randInt(2, 15);
  const correct = (a * b).toString(16).toUpperCase();
  return {
    id: Date.now(),
    display: `${a.toString(16).toUpperCase()} × ${b.toString(16).toUpperCase()} = ?(16)`,
    mode: 'multiplication',
    correct,
    options: makeOptions(correct, () => randInt(4, 225).toString(16).toUpperCase()),
  };
}

const GENERATORS = {
  'hex-to-dec':     genHexToDec,
  'hex-to-oct':     genHexToOct,
  'hex-to-bin':     genHexToBin,
  'addition':       genAddition,
  'subtraction':    genSubtraction,
  'multiplication': genMultiplication,
};

export function generateQuestion(mode: string): Question {
  if (mode === 'random') {
    const modes = Object.keys(GENERATORS) as Exclude<Mode, 'random'>[];
    return GENERATORS[modes[randInt(0, modes.length - 1)]]();
  }
  const gen = GENERATORS[mode as Exclude<Mode, 'random'>];
  return gen ? gen() : genHexToDec();
}