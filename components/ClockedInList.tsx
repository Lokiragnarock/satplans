import { initialsOf } from "./ui";

interface Person {
  id: string;
  name: string;
  startedAt: string | null;
}

interface Props {
  people: Person[];
  now: Date;
}

function hms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function ClockedInList({ people, now }: Props) {
  const live = people.filter((p) => p.startedAt).length;
  const sorted = [...people].sort((a, b) => Number(!!b.startedAt) - Number(!!a.startedAt));
  return (
    <section>
      <h2 className="label-md mb-3 flex items-center gap-2 text-on-surface-variant">
        <span className="pulse-dot h-2 w-2 rounded-full bg-tertiary" />
        Live now ({live} grinding)
      </h2>
      <ul className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
        {sorted.map((p) => {
          const on = !!p.startedAt;
          return (
            <li key={p.id} className={`flex w-16 shrink-0 flex-col items-center gap-1 ${on ? "" : "opacity-40"}`}>
              <span className="relative">
                <span
                  className={`label-lg flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-highest ${
                    on ? "ring-2 ring-tertiary" : ""
                  }`}
                >
                  {initialsOf(p.name)}
                </span>
                {on && (
                  <span className="pulse-dot absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-tertiary" />
                )}
              </span>
              <span className="w-full truncate text-center text-xs">{p.name}</span>
              <span className={`label-sm tabular-nums ${on ? "text-tertiary" : "text-on-surface-variant"}`}>
                {p.startedAt ? hms(now.getTime() - new Date(p.startedAt).getTime()) : "Offline"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
