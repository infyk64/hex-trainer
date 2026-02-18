import type { SolutionStep } from '../types';

interface Props {
  steps: SolutionStep[];
}

export function Solution({ steps }: Props) {
  return (
    <div className="solution-block">
      <div className="sol-title">▸ Пошаговое решение</div>
      {steps.map(s => (
        <div key={s.step} className="sol-step">
          <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>{s.step}.</span>
          <span>
            {s.description}{' '}
            <b>{s.value}</b>
          </span>
        </div>
      ))}
    </div>
  );
}