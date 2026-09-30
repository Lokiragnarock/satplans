import { Card } from "./ui";

interface Props {
  members: { id: string; display_name: string; xp: number }[];
  meId: string;
}

export function Leaderboard({ members, meId }: Props) {
  return (
    <Card title="Leaderboard">
      <ol className="space-y-2">
        {[...members]
          .sort((a, b) => b.xp - a.xp)
          .map((m, i) => (
            <li key={m.id} className="flex justify-between text-sm">
              <span className={m.id === meId ? "font-semibold text-emerald-300" : ""}>
                {i + 1}. {m.display_name}
              </span>
              <span className="text-zinc-400">{m.xp} XP</span>
            </li>
          ))}
      </ol>
    </Card>
  );
}
