import { describe, expect, it } from "vitest";
import { allocateTopics, isPptEvent, isPresentationQuest } from "./allocate";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const members = ["a", "b", "c", "d"];
const subs = [
  { member_id: "a", topic: "Socks" },
  { member_id: "b", topic: "Clouds" },
  { member_id: "c", topic: "Ladders" },
  { member_id: "d", topic: "Elevators" },
  { member_id: "a", topic: "Pens" },
];

describe("allocateTopics", () => {
  it("gives every member exactly one distinct topic", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = allocateTopics(members, subs, seeded(seed));
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.picks.map((p) => p.member_id).sort()).toEqual(members);
      expect(new Set(r.picks.map((p) => p.topic)).size).toBe(members.length);
    }
  });

  it("avoids a member's own submission when a valid arrangement exists", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = allocateTopics(members, subs, seeded(seed));
      if (!r.ok) throw new Error("expected ok");
      for (const p of r.picks) {
        const own = subs.find((s) => s.topic === p.topic)?.member_id;
        expect(own).not.toBe(p.member_id);
      }
    }
  });

  it("works with exactly two members who swapped", () => {
    const r = allocateTopics(["x", "y"], [
      { member_id: "x", topic: "X topic" },
      { member_id: "y", topic: "Y topic" },
    ], seeded(7));
    expect(r.ok && r.picks.find((p) => p.member_id === "x")?.topic).toBe("Y topic");
  });

  it("leaves extra topics unused", () => {
    const many = [...subs, { member_id: "b", topic: "Mugs" }, { member_id: "c", topic: "Doors" }];
    const r = allocateTopics(members, many, seeded(3));
    expect(r.ok && r.picks.length).toBe(4);
  });

  it("returns an error with fewer topics than members", () => {
    const r = allocateTopics(members, subs.slice(0, 3));
    expect(r.ok).toBe(false);
  });

  it("falls back to any arrangement when avoiding own topics is impossible", () => {
    const only = [
      { member_id: "a", topic: "T1" },
      { member_id: "a", topic: "T2" },
    ];
    const r = allocateTopics(["a", "b"], only, seeded(5));
    expect(r.ok).toBe(true);
    if (r.ok) expect(new Set(r.picks.map((p) => p.topic)).size).toBe(2);
  });
});

describe("event helpers", () => {
  it("matches PPT events and presentation quests", () => {
    expect(isPptEvent("PPT Night")).toBe(true);
    expect(isPptEvent("House Party")).toBe(false);
    expect(isPresentationQuest("Presentation: Asha")).toBe(true);
    expect(isPresentationQuest("Cook food")).toBe(false);
  });
});
