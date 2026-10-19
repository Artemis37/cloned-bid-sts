import { scoreTone } from '../lib/insights.js';

export function ScorePill({ score }) {
  return (
    <span className={`ins-score ${scoreTone(score)}`} title="Điểm gợi ý (0-100)">
      {score}
    </span>
  );
}

export function Chips({ chips }) {
  return (
    <div className="ins-chips">
      {chips.map(chip => (
        <span key={chip.text} className={`ins-chip ${chip.tone}`}>
          {chip.text}
        </span>
      ))}
    </div>
  );
}
