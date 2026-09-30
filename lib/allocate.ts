// Pure helpers for the PPT Night topic allocation. No I/O, so they are easy to test.

export const isPptEvent = (title: string) => /ppt/i.test(title);

export const PRESENTATION_PREFIX = "Presentation: ";
export const isPresentationQuest = (title: string) => title.startsWith(PRESENTATION_PREFIX);

export interface TopicSubmissionLike {
  member_id: string;
  topic: string;
}

export interface Pick {
  member_id: string;
  topic: string;
}

export type AllocationResult = { ok: true; picks: Pick[] } | { ok: false; error: string };

function shuffled<T>(items: T[], rng: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_TRIES = 500;

// Deals one distinct submitted topic to every member. Extra topics stay unused. Tries to avoid giving
// a member a topic they submitted themselves by reshuffling; if no arrangement is found it falls back
// to the shuffle with the fewest self-assignments.
export function allocateTopics(
  memberIds: string[],
  submissions: TopicSubmissionLike[],
  rng: () => number = Math.random,
): AllocationResult {
  const n = memberIds.length;
  if (n === 0) return { ok: false, error: "There are no members to allocate to" };
  if (submissions.length < n) {
    return { ok: false, error: `Need at least ${n} topics, one per member (${submissions.length} so far)` };
  }
  let best: Pick[] | null = null;
  let bestClashes = Infinity;
  for (let t = 0; t < MAX_TRIES; t++) {
    const order = shuffled(submissions, rng).slice(0, n);
    const picks = memberIds.map((member_id, i) => ({ member_id, topic: order[i].topic }));
    const clashes = memberIds.reduce((c, id, i) => c + (order[i].member_id === id ? 1 : 0), 0);
    if (clashes < bestClashes) {
      best = picks;
      bestClashes = clashes;
    }
    if (clashes === 0) break;
  }
  return { ok: true, picks: best ?? [] };
}
