import type { Mode } from '../types';

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const MODES: { value: Mode; label: string }[] = [
  { value: 'hex-to-dec',     label: '16 → 10'    },
  { value: 'hex-to-oct',     label: '16 → 8'     },
  { value: 'hex-to-bin',     label: '16 → 2'     },
  { value: 'addition',       label: 'Сложение'   },
  { value: 'subtraction',    label: 'Вычитание'  },
  { value: 'multiplication', label: 'Умножение'  },
  { value: 'random',         label: '🎲 Случайные' },
];

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="mode-row" style={{ flexWrap: 'wrap' }}>
      {MODES.map(m => (
        <button
          key={m.value}
          className={`mode-btn ${mode === m.value ? 'active' : ''}`}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}