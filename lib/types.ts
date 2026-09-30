import type { ChallengeStatus } from "./window";

export interface Me {
  id: string;
  group_id: string;
  display_name: string;
  role: "admin" | "member";
  xp: number;
}

export interface MemberLite {
  id: string;
  display_name: string;
  xp: number;
  role: "admin" | "member";
}

export interface GroupInfo {
  id: string;
  name: string;
  timezone: string;
  night_start_hour: number;
  night_end_hour: number;
  daily_target_minutes: number;
  weekly_target_minutes: number;
  template_loaded: boolean;
}

export interface TimeEntry {
  id: string;
  member_id: string;
  started_at: string;
  ended_at: string | null;
  note: string | null;
}

export interface GroupTarget {
  id: string;
  label: string;
  unit: string;
  goal: number;
  progress: number;
}

export interface Contribution {
  target_id: string;
  member_id: string;
  amount: number;
}

export interface DashboardData {
  me: Me;
  group: GroupInfo;
  members: MemberLite[];
  entries: TimeEntry[];
  targets: GroupTarget[];
  contributions: Contribution[];
}

export type EventStatus = "scheduled" | "gathering" | "active" | "completed";

export interface WorldEvent {
  id: string;
  host_id: string;
  title: string;
  spot_label: string;
  scheduled_at: string;
  status: EventStatus;
  min_attendees: number;
  attendees: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  group_wide: boolean;
  counter_target: number | null;
  counter_unit: string | null;
  assigned_to: string | null;
}

export interface QuestCompletion {
  quest_id: string;
  member_id: string;
  count: number;
  completed_at: string | null;
}

export interface Assignment {
  member_id: string;
  kind: "topic" | "dish";
  topic: string | null;
  revealed: boolean;
}

export interface EventDetail {
  me: Me;
  event: WorldEvent;
  members: MemberLite[];
  attendees: string[];
  quests: Quest[];
  questsHidden: boolean;
  completions: QuestCompletion[];
  assignments: Assignment[];
}

export interface Challenge {
  id: string;
  issuer_id: string;
  target_id: string;
  prompt: string;
  stake_xp: number;
  status: ChallengeStatus;
  expires_at: string;
  proposed_winner_id: string | null;
  winner_id: string | null;
}

export interface ChallengesData {
  me: Me;
  group: GroupInfo;
  members: MemberLite[];
  challenges: Challenge[];
}
