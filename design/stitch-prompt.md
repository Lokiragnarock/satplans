# Stitch prompt: Ballin On Sats

Paste the **Master prompt** first to set the look. Then paste each **Screen prompt** one at a time so Stitch keeps the same style. Generate for **Mobile**.

---

## Master prompt

Design a mobile-first web app called "Ballin On Sats". It is a private game for a small friend group of about 5 to 8 people who spend a Saturday completing shared challenges together, then finish with a house party at night. Think basketball court meets night city: competitive, loud, fun, not corporate.

Visual direction:
- Dark theme. Near-black court-asphalt background (#0B0D10), raised cards in dark charcoal (#151920).
- Primary accent: hot basketball orange (#FF6B1A). Secondary accent: electric cyan (#22D3EE) used only for night mode and challenge elements.
- Success green (#4ADE80) for completed items, warning amber for countdowns, red for expired or declined.
- Big, heavy, condensed display type for headings and numbers (like a sports scoreboard, e.g. Barlow Condensed or Oswald, uppercase). Clean sans (Inter) for body text.
- Numbers are the heroes: large tabular numerals for scores, counts and timers.
- Chunky rounded progress bars with a subtle court-line motif (thin white center-line and arc details as faint background decoration, never cluttering content).
- Bottom tab bar with 4 tabs: Home, Events, Duels, Board. Thumb-friendly buttons, minimum 48px height.
- Small playful touches: XP chips with a lightning icon, flame icon for streaks, a basketball icon for the logo. No stock photos, no emoji walls.
- Interface copy is short, punchy, second person. No login, no sign-up, no email fields anywhere. Everyone opens the app through a personal link, so the app already knows who they are and shows their name and avatar initials at the top.

---

## Screen prompts

### 1. Home (dashboard)
Top bar: "BALLIN ON SATS" wordmark, and on the right the current player's avatar circle with initials, their name and XP chip.
A hero card "TEAM HOURS" showing pooled clocked-in time today versus the daily target, for example "14h 20m / 20h", with a large chunky orange progress bar, and a smaller weekly bar underneath.
A large full-width CLOCK IN button (turns into a red CLOCK OUT button with a live running timer, e.g. 01:42:17, when active). Small optional note field beneath it.
A horizontal "Who's grinding now" strip of avatars with green live dots and their running times.
A section "TEAM TARGETS" with four stacked cards, each with an icon, big number and progress bar and a "+ Log" button:
- Run: 12.5 / 20 km
- Squats: 210 / 300
- Free throws: 1,040 / 1,500
- Bottle flips: 120 / 200
Each card shows small avatar dots of the top contributors.
A compact "Next up" card showing the next world event with title, spot, time and a "View" button.

### 2. Events list
Title "WORLD EVENTS". A vertical list of event cards. Each card has: status pill (Scheduled, Gathering, LIVE, Done), title, spot name with a pin icon, time, and a row of attendee avatars with "3 here". Two example cards: "Scooter Day" at "Cafe near college gate" (LIVE, orange glow) and "House Party" (Scheduled, cyan tone, moon icon, 9:00 PM). Floating "+ New event" button.
New event bottom sheet: title, spot, date and time, "players needed to start" stepper, Create button.

### 3. Event detail (gathering state)
Header with event title, spot with pin, time. A big "I'M HERE" button and a live list of who has arrived (green check) and who has not (grey). A progress line "2 of 2 needed here". If enough people are here, the host sees a huge glowing "START WORLD EVENT" button. Quests are visible but locked with blurred text and a lock icon until the event starts.

### 4. Event detail (LIVE state)
Same header with a pulsing LIVE badge and elapsed time. A list of quest cards, each with title, short description, XP chip, and a state: open, done by X (avatar), or per-player counter. Example quests for Scooter Day: "Rent scooters and do stuff", "Airport stop", "Reel shoot: Justin Bieber show-you-off style", "Group vlog". Tapping "Complete" gives a satisfying confirm animation and +XP toast. Host sees an "Add quest" button.

### 5. House Party screen (night mode)
Cyan and purple accented night variant of the event detail. Three feature cards:
- "MONOPOLY" card: a big round counter out of 20 with a +1 round button, plus cards for "Minecraft one shot" and "Delete Insta and Snap" with a per-player done check.
- "COOK + SURPRISE": a mystery grid of dishes and player names hidden behind cards, with a big REVEAL button that flips them to show who eats what.
- "PRESENTATION ROUND": a list of players with their allotted niche topic revealed as a tag (for example "History of paper clips"), a "No AI, you must talk" note, and a "Presented" confirmation button that another player has to tap.

### 6. Duels (night quick-time challenges)
Title "DUELS" with a moon icon. Two segments: Inbox and Sent.
A state banner: before 9 PM "Duels unlock at 9:00 PM" with a lock and a countdown; after 9 PM "DUELS OPEN".
Inbox card: challenger avatar and name, the challenge prompt in large text (for example "First to sink 5 free throws"), XP stake chip, an amber countdown ring "12:41 left", and two buttons ACCEPT (orange) and DECLINE (ghost).
Sent card: target avatar, prompt, state (Pending, Accepted, Awaiting result, Won, Lost, Expired) and a "Pick winner" button when accepted.
"+ Challenge" sheet: choose player from avatar row, prompt text, XP stake stepper, response window chips (5, 15, 30 min), Send button that is disabled with an explanation before the night window.

### 7. Leaderboard
Title "BOARD". A podium for the top 3 with large avatars, XP and crowns. Below, a ranked list with rank number, avatar, name, XP, and small badges (Most hours, Most quests, Duel king). A tab toggle for Today and All-time.

### 8. Key error state
Full screen, friendly: basketball icon, "This link is not yours" and "Ask the host for your personal link." No form fields and no buttons besides a subtle "Copy host message" ghost link.

---

## Tips for Stitch
- Generate the Home screen first, lock the look, then generate the rest by pasting the screen prompt with "Use the same style as the Home screen".
- Export each screen as HTML/CSS (or copy to Figma) and drop the files into `group-quest/design/screens/`. Keep the filenames numbered like above.
