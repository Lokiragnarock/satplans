"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import type { MemberLite } from "@/lib/types";

export type AddResult = { ok: true; key: string; name: string } | { ok: false; error: string };

interface Props {
  members: MemberLite[];
  startsAtLocal: string;
  targetHours: number | null;
  durationHours: number;
  busy: boolean;
  onSaveSettings: (startsAtLocal: string, targetHours: number | null) => Promise<boolean>;
  onAddMember: (name: string) => Promise<AddResult>;
}

export function AdminPanel({ members, startsAtLocal, targetHours, durationHours, busy, onSaveSettings, onAddMember }: Props) {
  const [start, setStart] = useState(startsAtLocal || "2026-10-31T10:00");
  const [target, setTarget] = useState(targetHours ? String(targetHours) : "");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const add = async () => {
    setAdding(true);
    setAddError(null);
    const r = await onAddMember(name);
    setAdding(false);
    if (r.ok) {
      setCreated({ name: r.name, link: `${window.location.origin}/k/${r.key}` });
      setCopied(false);
      setName("");
    } else {
      setAddError(r.error);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card title="Admin: squad and game window" icon="admin_panel_settings">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!start) return;
          void onSaveSettings(start, target.trim() === "" ? null : Number(target));
        }}
      >
        <label className="label-sm block text-on-surface-variant">
          Game starts (your local time)
          <input className={`${inputClass} mt-1`} type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="label-sm block text-on-surface-variant">
          Team hours goal (blank uses the {durationHours}h game length)
          <input
            className={`${inputClass} mt-1`}
            type="number"
            min="1"
            step="1"
            placeholder={String(durationHours)}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <Button type="submit" className="w-full" disabled={busy || !start}>
          Save
        </Button>
      </form>

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="label-md mb-2 text-on-surface-variant">Squad ({members.length})</p>
        <ul className="mb-3 flex flex-wrap gap-2 text-sm">
          {members.map((m) => (
            <li key={m.id} className="rounded-full bg-surface-container-high px-3 py-1">
              {m.display_name}
              {m.role === "admin" ? " (admin)" : ""}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <input className={inputClass} placeholder="New member name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" className="shrink-0" disabled={adding || !name.trim()}>
            Add member
          </Button>
        </form>
        {addError && <p className="mt-2 rounded-lg bg-error/15 px-3 py-2 text-sm text-error">{addError}</p>}
        {created && (
          <div className="mt-3 rounded-lg bg-surface-container-high p-3">
            <p className="label-sm text-on-surface-variant">Personal link for {created.name}. Send it privately, it is shown only now.</p>
            <p className="mt-1 break-all text-xs text-on-surface">{created.link}</p>
            <Button type="button" variant="ghost" className="mt-2" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
