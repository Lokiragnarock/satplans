"use client";

import { useState } from "react";
import { Button, Card, Icon, inputClass } from "./ui";
import { relativeTime } from "@/lib/window";
import type { MemberLite, TopicSubmission } from "@/lib/types";

interface Props {
  submissions: TopicSubmission[];
  available: boolean;
  members: MemberLite[];
  meId: string;
  allocated: boolean;
  locked: string | null;
  busy: boolean;
  now: Date;
  onAdd: (topic: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export function TopicFeed({ submissions, available, members, meId, allocated, locked, busy, now, onAdd, onDelete }: Props) {
  const [text, setText] = useState("");
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";
  const canEdit = available && !allocated && locked === null;

  return (
    <Card title="Topic feed" icon="forum">
      {!available ? (
        <p className="text-sm text-on-surface-variant/70">
          Topics are not switched on yet. The admin needs to apply supabase/migrations/0004_ppt_night.sql.
        </p>
      ) : (
        <>
          <p className="scoreboard-title mb-3">
            <span className="text-primary-container">{submissions.length}</span>
            <span className="text-on-surface/40">
              {" "}
              {submissions.length === 1 ? "topic" : "topics"} for {members.length} members
            </span>
          </p>
          {allocated && (
            <p className="mb-3 flex items-center gap-1.5 text-sm text-tertiary">
              <Icon name="check_circle" className="!text-[16px]" />
              Allocation done
            </p>
          )}
          {locked && !allocated && <p className="mb-3 text-xs text-on-surface/60">{locked}</p>}
          {canEdit && (
            <form
              className="mb-3 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                if (await onAdd(text)) setText("");
              }}
            >
              <input
                className={inputClass}
                maxLength={120}
                placeholder="Add a niche topic"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button type="submit" disabled={busy || !text.trim()}>
                Add
              </Button>
            </form>
          )}
          {submissions.length === 0 && <p className="text-sm text-on-surface-variant/70">No topics yet. Add yours.</p>}
          <ul className="space-y-2">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-white/5 bg-surface-container-low p-3"
              >
                <div className="min-w-0">
                  <p className="label-lg break-words">{s.topic}</p>
                  <p className="label-sm mt-1 text-on-surface/50">
                    {name(s.member_id)} | {relativeTime(s.created_at, now)}
                  </p>
                </div>
                {canEdit && s.member_id === meId && (
                  <Button variant="ghost" disabled={busy} onClick={() => onDelete(s.id)} aria-label={`Delete ${s.topic}`}>
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
