import { describe, expect, it } from "vitest";
import {
  effectiveChallengeStatus,
  formatDuration,
  isNightWindow,
  minutesInPeriod,
  periodBounds,
  progress,
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
