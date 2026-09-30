"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import type { MemberLite } from "@/lib/types";

interface Props {
  members: MemberLite[];
  open: boolean;
  closedReason: string;
  busy: boolean;
  onIssue: (input: { targetId: string; prompt: string; stake: number; windowMinutes: number }) => Promise<boolean>;
}

export function ChallengeForm({ members, open, closedReason, busy, onIssue }: Props) {
  const [target, setTarget] = useState("");
  const [prompt, setPrompt] = useState("");
  const [stake, setStake] = useState("10");
  const [windowMinutes, setWindowMinutes] = useState("15");

  return (
    <Card title="Issue a challenge">
      {!open && <p className="mb-3 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300">{closedReason}</p>}
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onIssue({
            targetId: target,
            prompt,
            stake: Number(stake) || 0,
            windowMinutes: Number(windowMinutes) || 15,
          });
          if (ok) setPrompt("");
        }}
      >
        <fieldset disabled={!open || busy} className="space-y-2 disabled:opacity-50">
          <select className={inputClass} required value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Who are you challenging?</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
          <textarea
            className={inputClass}
            rows={2}
            required
            placeholder="The challenge"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-zinc-400">
              XP stake
              <input className={inputClass} type="number" min="0" max="500" value={stake} onChange={(e) => setStake(e.target.value)} />
            </label>
            <label className="flex-1 text-xs text-zinc-400">
              Window (min)
              <input
                className={inputClass}
                type="number"
                min="1"
                max="240"
                value={windowMinutes}
                onChange={(e) => setWindowMinutes(e.target.value)}
              />
            </label>
          </div>
          <Button type="submit" className="w-full">
            Send challenge
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
