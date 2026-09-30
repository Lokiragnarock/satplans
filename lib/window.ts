export type Period = "day" | "week";

export interface TimeSpan {
  started_at: string;
  ended_at: string | null;
}

export function localParts(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

export function localHour(now: Date, tz: string): number {
  return localParts(now, tz).hour;
}

export function isNightWindow(now: Date, tz: string, startHour: number, endHour = 5): boolean {
  const h = localHour(now, tz);
  return startHour <= endHour ? h >= startHour && h < endHour : h >= startHour || h < endHour;
}

function offsetMs(instant: number, tz: string): number {
  const p = localParts(new Date(instant), tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instant / 1000) * 1000;
}

function localMidnight(year: number, month: number, day: number, tz: string): number {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - offsetMs(guess, tz);
  return guess - offsetMs(first, tz);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function periodBounds(now: Date, tz: string, period: Period): { start: Date; end: Date } {
  const p = localParts(now, tz);
  const back = period === "week" ? WEEKDAYS.indexOf(p.weekday) : 0;
  const days = period === "week" ? 7 : 1;
  const startDay = new Date(Date.UTC(p.year, p.month - 1, p.day - back));
  const endDay = new Date(Date.UTC(p.year, p.month - 1, p.day - back + days));
  return {
    start: new Date(localMidnight(startDay.getUTCFullYear(), startDay.getUTCMonth() + 1, startDay.getUTCDate(), tz)),
    end: new Date(localMidnight(endDay.getUTCFullYear(), endDay.getUTCMonth() + 1, endDay.getUTCDate(), tz)),
  };
}

export function minutesInPeriod(spans: TimeSpan[], start: Date, end: Date, now: Date): number {
  let ms = 0;
  for (const s of spans) {
    const from = Math.max(new Date(s.started_at).getTime(), start.getTime());
    const to = Math.min(s.ended_at ? new Date(s.ended_at).getTime() : now.getTime(), end.getTime());
    if (to > from) ms += to - from;
  }
  return ms / 60000;
}

export function progress(done: number, goal: number) {
  const pct = goal > 0 ? Math.min(100, (done / goal) * 100) : 0;
  return { pct, done, goal, remaining: Math.max(0, goal - done), reached: goal > 0 && done >= goal };
}

export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired" | "proposed" | "disputed" | "resolved";

export function effectiveChallengeStatus(
  c: { status: ChallengeStatus; expires_at: string },
  now: Date,
): ChallengeStatus {
  return c.status === "pending" && new Date(c.expires_at).getTime() <= now.getTime() ? "expired" : c.status;
}

export function remainingMs(expiresAt: string, now: Date): number {
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime());
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
