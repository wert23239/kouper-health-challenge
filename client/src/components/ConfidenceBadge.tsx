interface Props {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: Props) {
  const pct = Math.round(confidence * 100);
  let color = 'bg-emerald-500';
  let textColor = 'text-emerald-700';
  let bgColor = 'bg-emerald-50';

  if (pct < 70) {
    color = 'bg-red-500';
    textColor = 'text-red-700';
    bgColor = 'bg-red-50';
  } else if (pct < 90) {
    color = 'bg-amber-500';
    textColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full ${bgColor}`}>
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${textColor}`}>{pct}%</span>
    </div>
  );
}
