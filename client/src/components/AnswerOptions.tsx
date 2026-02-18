import type { AnswerOption } from '../types';

interface Props {
  options: AnswerOption[];
  selected: number | null;
  onChange: (id: number) => void;
  disabled: boolean;
}

export function AnswerOptions({ options, selected, onChange, disabled }: Props) {
  const getClass = (opt: AnswerOption) => {
    const classes = ['option-btn'];
    if (selected === opt.id) classes.push('selected');
    if (disabled && opt.isCorrect) classes.push('correct');
    if (disabled && selected === opt.id && !opt.isCorrect) classes.push('wrong');
    return classes.join(' ');
  };

  return (
    <div className="options-grid">
      {options.map(opt => (
        <button
          key={opt.id}
          className={getClass(opt)}
          onClick={() => !disabled && onChange(opt.id)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}