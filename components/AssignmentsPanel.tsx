"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import type { Assignment, MemberLite } from "@/lib/types";

interface Props {
  title: string;
  hint: string;
  assignments: Assignment[];
  members: MemberLite[];
  meId: string;
  isHost: boolean;
  busy: boolean;
  onAssign: (items: string[]) => void;
  onReveal: () => void;
}

export function AssignmentsPanel({ title, hint, assignments, members, meId, isHost, busy, onAssign, onReveal }: Props) {
  const [text, setText] = useState("");
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";
  const allRevealed = assignments.length > 0 && assignments.every((a) => a.revealed);
  const mine = assignments.find((a) => a.member_id === meId);

  if (!isHost && assignments.length === 0) return null;

  return (
    <Card title={title}>
      {mine && (
        <p className="mb-3 text-sm">
          Yours: <span className="font-semibold text-emerald-300">{mine.revealed ? mine.topic : "hidden until reveal"}</span>
        </p>
      )}
      {assignments.length > 0 && (
        <ul className="mb-3 space-y-1 text-sm">
          {assignments.map((a) => (
            <li key={a.member_id} className="flex justify-between">
              <span>{name(a.member_id)}</span>
              <span className="text-zinc-400">{a.revealed ? a.topic : "?"}</span>
            </li>
          ))}
        </ul>
      )}
      {isHost && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onAssign(text.split("\n"));
          }}
        >
          <textarea className={inputClass} rows={4} placeholder={hint} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" variant="ghost" disabled={busy}>
              Randomly assign
            </Button>
            {assignments.length > 0 && !allRevealed && (
              <Button type="button" disabled={busy} onClick={onReveal}>
                Reveal
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
