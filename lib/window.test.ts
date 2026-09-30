import { describe, expect, it } from "vitest";
import {
  effectiveChallengeStatus,
  formatCountdown,
  formatDuration,
  gameInfoFromRow,
  gamePhase,
  gameWindow,
  lockReason,
  isNightWindow,
  minutesInPeriod,
  periodBounds,
  prepLockReason,
  progress,
  relativeTime,
  remainingMs,
} from "./window";

describe("isNightWindow", () => {
  it("uses the group timezone, not UTC", () => {
    const instant = new Date("2026-10-03T16:00:00Z");
    expect(isNightWindow(instant, "Asia/Kolkata", 21)).toBe(true);
    expect(isNightWindow(instant, "UTC", 21)).toBe(false);
  });

  it("is closed before the start hour and open right at it", () => {
    expect(isNightWindow(new Date("2026-10-03T15:29:00Z"), "Asia/Kolkata", 21)).toBe(false);
    expect(isNightWindow(new Date("2026-10-03T15:30:00Z"), "Asia/Kolkata", 21)).toBe(true);
  });

  it("stays open after midnight until the end hour", () => {
    expect(isNightWindow(new Date("2026-10-03T22:30:00Z"), "UTC", 21, 5)).toBe(true);
    expect(isNightWindow(new Date("2026-10-04T04:59:00Z"), "UTC", 21, 5)).toBe(true);
    expect(isNightWindow(new Date("2026-10-04T05:00:00Z"), "UTC", 21, 5)).toBe(false);
  });
});

describe("periodBounds", () => {
  it("returns the local day in the group timezone", () => {
    const { start, end } = periodBounds(new Date("2026-10-03T20:00:00Z"), "Asia/Kolkata", "day");
    expect(start.toISOString()).toBe("2026-10-03T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-10-04T18:30:00.000Z");
  });

  it("starts the week on Monday", () => {
    const { start, end } = periodBounds(new Date("2026-10-03T12:00:00Z"), "UTC", "week");
    expect(start.toISOString()).toBe("2026-09-28T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("handles DST changes", () => {
    const { start, end } = periodBounds(new Date("2026-03-08T20:00:00Z"), "America/New_York", "day");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });
});

describe("minutesInPeriod", () => {
  const start = new Date("2026-10-03T00:00:00Z");
  const end = new Date("2026-10-04T00:00:00Z");
  const now = new Date("2026-10-03T12:00:00Z");

  it("clips spans to the period and counts open spans up to now", () => {
    const spans = [
      { started_at: "2026-10-02T23:00:00Z", ended_at: "2026-10-03T01:00:00Z" },
      { started_at: "2026-10-03T11:00:00Z", ended_at: null },
    ];
    expect(minutesInPeriod(spans, start, end, now)).toBe(120);
  });
});

describe("progress", () => {
  it("caps at 100 percent and reports remaining", () => {
    expect(progress(30, 120)).toMatchObject({ pct: 25, remaining: 90, reached: false });
    expect(progress(150, 120)).toMatchObject({ pct: 100, remaining: 0, reached: true });
  });
});

describe("challenge expiry", () => {
  const now = new Date("2026-10-03T22:00:00Z");

  it("marks pending challenges expired at read time", () => {
    expect(effectiveChallengeStatus({ status: "pending", expires_at: "2026-10-03T21:59:00Z" }, now)).toBe("expired");
    expect(effectiveChallengeStatus({ status: "pending", expires_at: "2026-10-03T22:10:00Z" }, now)).toBe("pending");
  });

  it("leaves accepted challenges alone", () => {
    expect(effectiveChallengeStatus({ status: "accepted", expires_at: "2026-10-03T21:00:00Z" }, now)).toBe("accepted");
  });

  it("computes the countdown", () => {
    expect(remainingMs("2026-10-03T22:10:00Z", now)).toBe(600000);
    expect(formatDuration(600000)).toBe("10:00");
    expect(formatDuration(3725000)).toBe("1:02:05");
  });
});

describe("gamePhase", () => {
  const start = "2026-10-03T09:00:00Z";
  const startMs = new Date(start).getTime();
  const H = 3600000;

  it("is unset without a start time", () => {
    expect(gamePhase(new Date(), null, 24)).toBe("unset");
    expect(gamePhase(new Date(), undefined, 24)).toBe("unset");
    expect(gamePhase(new Date(), "not a date", 24)).toBe("unset");
    expect(gameWindow(new Date(), null, 24)).toMatchObject({ endsAt: null, msUntilStart: null, msUntilEnd: null });
  });

  it("is before until exactly the start, live at the start", () => {
    expect(gamePhase(startMs - 1, start, 24)).toBe("before");
    expect(gamePhase(startMs, start, 24)).toBe("live");
  });

  it("is live until exactly the end, ended at the end", () => {
    expect(gamePhase(startMs + 24 * H - 1, start, 24)).toBe("live");
    expect(gamePhase(startMs + 24 * H, start, 24)).toBe("ended");
  });

  it("respects other durations", () => {
    expect(gamePhase(startMs + 2 * H - 1, start, 2)).toBe("live");
    expect(gamePhase(startMs + 2 * H, start, 2)).toBe("ended");
    expect(gamePhase(startMs + 24 * H, start, 48)).toBe("live");
    expect(gamePhase(startMs + 168 * H, start, 168)).toBe("ended");
  });

  it("reports endsAt and the time remaining", () => {
    const before = gameWindow(startMs - 5 * 60000, start, 24);
    expect(before.endsAt?.toISOString()).toBe("2026-10-04T09:00:00.000Z");
    expect(before.msUntilStart).toBe(300000);
    expect(before.msUntilEnd).toBe(24 * H + 300000);
    const live = gameWindow(startMs + 10 * H, start, 24);
    expect(live.msUntilStart).toBe(0);
    expect(live.msUntilEnd).toBe(14 * H);
    const ended = gameWindow(startMs + 30 * H, start, 24);
    expect(ended.msUntilEnd).toBe(0);
  });
});

describe("gameInfoFromRow", () => {
  it("degrades to unset when the migration columns are missing", () => {
    const info = gameInfoFromRow({ id: "g" });
    expect(info).toMatchObject({ phase: "unset", startsAt: null, durationHours: 24, targetHours: 24, endsAt: null });
  });

  it("uses target_hours when set and the duration otherwise", () => {
    const now = new Date("2026-10-03T10:00:00Z");
    const a = gameInfoFromRow({ starts_at: "2026-10-03T09:00:00Z", duration_hours: 12, target_hours: null }, now);
    expect(a).toMatchObject({ phase: "live", durationHours: 12, targetHours: 12, endsAt: "2026-10-03T21:00:00.000Z" });
    const b = gameInfoFromRow({ starts_at: "2026-10-03T09:00:00Z", duration_hours: 24, target_hours: 30 }, now);
    expect(b.targetHours).toBe(30);
  });
});

describe("lock messages and countdown", () => {
  it("has a reason for every non-live phase", () => {
    expect(lockReason("unset")).toBe("The admin has not set the start time yet");
    expect(lockReason("before")).toBeTruthy();
    expect(lockReason("ended")).toBeTruthy();
    expect(lockReason("live")).toBeNull();
  });

  it("formats days, hours and minutes", () => {
    expect(formatCountdown((2 * 1440 + 11 * 60 + 20) * 60000)).toBe("2d 11h 20m");
    expect(formatCountdown((14 * 60 + 5) * 60000)).toBe("14h 05m");
    expect(formatCountdown(0)).toBe("0h 00m");
  });
});

describe("hours clipped to the game window", () => {
  const start = new Date("2026-10-03T09:00:00Z");
  const end = new Date("2026-10-04T09:00:00Z");
  const now = new Date("2026-10-05T00:00:00Z");

  it("ignores time before the start and stops an open entry at the end", () => {
    const spans = [
      { started_at: "2026-10-03T08:00:00Z", ended_at: "2026-10-03T10:00:00Z" },
      { started_at: "2026-10-04T07:00:00Z", ended_at: null },
    ];
    expect(minutesInPeriod(spans, start, end, now)).toBe(60 + 120);
  });
});

describe("prepLockReason", () => {
  it("allows prep before and during the game only", () => {
    expect(prepLockReason("before")).toBeNull();
    expect(prepLockReason("live")).toBeNull();
    expect(prepLockReason("unset")).not.toBeNull();
    expect(prepLockReason("ended")).not.toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  it("formats recent and older times", () => {
    expect(relativeTime("2026-10-31T11:59:40Z", now)).toBe("just now");
    expect(relativeTime("2026-10-31T11:50:00Z", now)).toBe("10 min ago");
    expect(relativeTime("2026-10-31T09:00:00Z", now)).toBe("3 h ago");
    expect(relativeTime("2026-10-29T12:00:00Z", now)).toBe("2 d ago");
  });
});
