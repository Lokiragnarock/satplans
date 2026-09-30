import { Card, ProgressBar } from "./ui";
import { progress } from "@/lib/window";

interface Props {
  label: string;
  doneMinutes: number;
  goalMinutes: number;
  perMember: { id: string; name: string; minutes: number }[];
}

const hours = (m: number) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

export function PooledProgress({ label, doneMinutes, goalMinutes, perMember }: Props) {
  const p = progress(doneMinutes, goalMinutes);
  return (
    <Card title={label}>
      <div className="mb-2 flex justify-between text-sm">
        <span>
          {hours(p.done)} of {hours(p.goal)}
        </span>
        <span className="text-zinc-400">{Math.round(p.pct)}%</span>
      </div>
      <ProgressBar pct={p.pct} />
      <ul className="mt-3 space-y-1 text-sm text-zinc-300">
        {perMember.map((m) => (
          <li key={m.id} className="flex justify-between">
            <span>{m.name}</span>
            <span className="text-zinc-400">{hours(m.minutes)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
