import { ProgressBar } from "./ui";
import { progress } from "@/lib/window";

interface Props {
  dailyDoneMinutes: number;
  dailyGoalMinutes: number;
  weeklyDoneMinutes: number;
  weeklyGoalMinutes: number;
}

const hoursOnly = (m: number) => `${Math.round((m / 60) * 10) / 10}h`;

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

export function PooledProgress({ dailyDoneMinutes, dailyGoalMinutes, weeklyDoneMinutes, weeklyGoalMinutes }: Props) {
  const day = progress(dailyDoneMinutes, dailyGoalMinutes);
  const week = progress(weeklyDoneMinutes, weeklyGoalMinutes);
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
          <h2 className="label-md text-primary-container">Today&apos;s squad grind</h2>
        </div>
        <p className="label-sm mt-4 text-on-surface-variant">Team hours</p>
        <p className="mb-4 mt-1 flex flex-wrap items-baseline gap-2">
          <Readout minutes={day.done} />
          <span className="scoreboard-title text-on-surface/30">/ {hoursOnly(day.goal)}</span>
        </p>
        <ProgressBar pct={day.pct} />
        <div className="mt-4">
          <p className="label-sm mb-1.5 text-secondary">
            Weekly target: {hoursOnly(week.done)} / {hoursOnly(week.goal)}
          </p>
          <ProgressBar pct={week.pct} accent="cyan" thin />
        </div>
      </div>
    </section>
  );
}
