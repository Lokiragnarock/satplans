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

export type GamePhase = "unset" | "before" | "live" | "ended";

export interface GameWindowInfo {
  startsAt: string | null;
  durationHours: number;
  targetHours: number;
  endsAt: string | null;
  phase: GamePhase;
}

type TimeLike = Date | string | number | null | undefined;

const HOUR_MS = 3600000;

function toMs(t: TimeLike): number | null {
  if (t === null || t === undefined || t === "") return null;
  const ms = t instanceof Date ? t.getTime() : new Date(t).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function gameWindow(now: Date | number, startsAt: TimeLike, durationHours: number) {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const start = toMs(startsAt);
  if (start === null) {
    return { phase: "unset" as GamePhase, endsAt: null as Date | null, msUntilStart: null as number | null, msUntilEnd: null as number | null };
  }
  const end = start + durationHours * HOUR_MS;
  const phase: GamePhase = nowMs < start ? "before" : nowMs < end ? "live" : "ended";
  return {
    phase,
    endsAt: new Date(end),
    msUntilStart: Math.max(0, start - nowMs),
    msUntilEnd: Math.max(0, end - nowMs),
  };
}

export function gamePhase(now: Date | number, startsAt: TimeLike, durationHours: number): GamePhase {
  return gameWindow(now, startsAt, durationHours).phase;
}

// Builds the window info from a raw groups row. Columns from migration 0003 may be missing
// (migration not applied yet), in which case the game counts as unset.
export function gameInfoFromRow(row: Record<string, unknown> | null | undefined, now: Date | number = new Date()): GameWindowInfo {
  const startsMs = toMs(row?.starts_at as TimeLike);
  const rawDuration = Number(row?.duration_hours);
  const durationHours = Number.isFinite(rawDuration) && rawDuration >= 1 ? rawDuration : 24;
  const rawTarget = Number(row?.target_hours);
  const targetHours = row?.target_hours != null && Number.isFinite(rawTarget) && rawTarget > 0 ? rawTarget : durationHours;
  const startsAt = startsMs === null ? null : new Date(startsMs).toISOString();
  const w = gameWindow(now, startsAt, durationHours);
  return { startsAt, durationHours, targetHours, endsAt: w.endsAt ? w.endsAt.toISOString() : null, phase: w.phase };
}

export function lockReason(phase: GamePhase): string | null {
  switch (phase) {
    case "unset":
      return "The admin has not set the start time yet";
    case "before":
      return "The game has not started yet";
    case "ended":
      return "The game is over, view only";
    default:
      return null;
  }
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(Math.max(0, ms) / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const mm = String(m).padStart(2, "0");
  return d > 0 ? `${d}d ${h}h ${mm}m` : `${h}h ${mm}m`;
}

// "2026-10-03T09:00" in the viewer's local time, for datetime-local inputs.
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Prep actions (adding or deleting PPT topics) are allowed before the game and while it is live.
export function prepLockReason(phase: GamePhase): string | null {
  switch (phase) {
    case "unset":
      return "The admin has not set the start time yet";
    case "ended":
      return "The game is over, view only";
    default:
      return null;
  }
}

export function relativeTime(iso: string, now: Date | number): string {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const sec = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
