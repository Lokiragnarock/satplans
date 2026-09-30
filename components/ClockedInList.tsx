import { Card } from "./ui";
import { formatDuration } from "@/lib/window";

interface Props {
  people: { id: string; name: string; startedAt: string; note: string | null }[];
  now: Date;
}

export function ClockedInList({ people, now }: Props) {
  return (
    <Card title="Clocked in now">
      {people.length === 0 ? (
        <p className="text-sm text-zinc-500">Nobody is grinding right now.</p>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {p.name}
                {p.note && <span className="text-zinc-500">{p.note}</span>}
              </span>
              <span className="font-mono tabular-nums text-zinc-400">
                {formatDuration(now.getTime() - new Date(p.startedAt).getTime())}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
