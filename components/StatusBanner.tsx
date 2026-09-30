import { Icon } from "./ui";
import { formatCountdown, gameWindow } from "@/lib/window";

interface Props {
  startsAt: string | null;
  durationHours: number;
  now: Date;
}

export function StatusBanner({ startsAt, durationHours, now }: Props) {
  const w = gameWindow(now, startsAt, durationHours);
  if (w.phase === "before") {
    return (
      <div role="status" className="label-md flex items-center gap-2 rounded-lg bg-secondary-container/15 px-3 py-2 text-secondary">
        <Icon name="schedule" className="!text-[18px]" />
        Starts in {formatCountdown(w.msUntilStart ?? 0)}
      </div>
    );
  }
  if (w.phase === "live") {
    return (
      <div role="status" className="label-md flex items-center gap-2 rounded-lg bg-primary-container/15 px-3 py-2 text-primary-container">
        <span className="pulse-dot h-2 w-2 rounded-full bg-primary-container" />
        Live, ends in {formatCountdown(w.msUntilEnd ?? 0)}
      </div>
    );
  }
  if (w.phase === "ended") {
    return (
      <div role="status" className="label-md flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-on-surface-variant">
        <Icon name="lock" className="!text-[18px]" />
        Game over, view only
      </div>
    );
  }
  return (
    <div role="status" className="label-md flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-2 text-on-surface-variant">
      <Icon name="lock_clock" className="!text-[18px]" />
      Start time not set
    </div>
  );
}
