import { Card, ProgressBar } from "./ui";
import { progress } from "@/lib/window";

interface Props {
  label: string;
  doneMinutes: number;
  goalMinutes: number;
}

const hours = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

export function PooledProgress({ label, doneMinutes, goalMinutes }: Props) {
  const p = progress(doneMinutes, goalMinutes);
  return (
    <Card title={label}>
      <p className="mb-2 text-sm">
        {hours(p.done)} of {hours(p.goal)}
      </p>
      <ProgressBar pct={p.pct} />
    </Card>
  );
}
