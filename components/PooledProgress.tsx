interface Props {
  doneMinutes: number;
  goalHours: number;
  caption: string;
}

function Readout({ minutes }: { minutes: number }) {
  const total = Math.floor(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return (
    <span className="headline-xl !text-[56px] text-on-surface">
      {h}
      <span className="text-primary-container">h</span> {String(m).padStart(2, "0")}
      <span className="text-primary-container">m</span>
    </span>
  );
}

export function PooledProgress({ doneMinutes, goalHours, caption }: Props) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-white/5 bg-surface-container p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border-2 border-white/5"
      />
      <div aria-hidden className="court-hash pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-primary-container" />
          <h2 className="label-md text-primary-container">Squad grind</h2>
        </div>
        <p className="label-sm mt-4 text-on-surface-variant">Team hours</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-2">
          <Readout minutes={doneMinutes} />
          <span className="scoreboard-title text-on-surface/30">/ {goalHours}h</span>
        </p>
        <p className="label-sm mt-3 text-on-surface-variant/70">{caption}</p>
      </div>
    </section>
  );
}
