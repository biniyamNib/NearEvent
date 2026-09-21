type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatsCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-2xl bg-bg-default border border-border-default p-4 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-status-success">{hint}</p> : null}
    </div>
  );
}