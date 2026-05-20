# AI Chat Agent — Design Spec

**Date:** 2026-05-21
**Status:** Draft, awaiting user review
**Branch (when implementation starts):** TBD (`feat/ai-chat-agent` suggested)

## Summary

Add a personalised AI chat feature to the menstrual health tracker. The user can:

1. Chat with an AI agent about menstrual / reproductive health concerns.
2. Upload medical prescriptions (photo or PDF), which are OCR'd into structured medication data.
3. Ask questions that combine her own cycle data with the uploaded prescriptions.

The agent has tools that read summarised cycle/log data and the prescription library, and can propose writes (new daily log entries, scheduled reminders) that the user confirms before they happen.

## Goals

- First-class chat UX, comparable to mainstream consumer AI apps.
- Multiple named conversations, persisted across sessions, recoverable across app restarts.
- Prescription library with structured extraction so the agent can reason about meds without re-reading images every turn.
- Clear, two-step consent flow that names exactly what data leaves the device and where it goes.
- Sensitive data encrypted at rest on the device.

## Non-goals (v1)

- Cross-device sync via login. (Anonymous device ID only — losing the install loses the history. Acceptable trade-off for v1.)
- On-device LLM inference. We accept that the agent and OCR run in the cloud, behind a Worker we control.
- Multi-language model selection in-app. Provider and model are fixed (Anthropic Claude).
- Voice input / voice output.
- Doctor-facing exports, medical-record interoperability, prescription-renewal workflows.

## Architecture overview

Three layers:

```
┌──────────────────────────────┐
│  Client (Expo / RN)          │
│  • Chat UI (FlashList v2)    │
│  • Encrypted SQLite + blobs  │
│  • Cycle-summary builder     │
│  • Streaming consumer        │
└─────────────┬────────────────┘
              │  HTTPS + SSE
              ▼
┌──────────────────────────────┐
│  mht-backend (Cloudflare)    │
│  • Workers + Durable Objects │
│  • D1 (metadata)             │
│  • R2 (24h OCR staging)      │
│  • Anthropic SDK toolRunner  │
└─────────────┬────────────────┘
              │
              ▼
       Anthropic Claude API
```

### Privacy boundary

- **Stays on device, always:** raw daily-log notes, settings, full cycle/log database.
- **Leaves device when the user is actively chatting:** a compact cycle-summary text blob (~300 tokens), the user's typed messages, any prescription image attached to the turn.
- **Leaves device when uploading a prescription:** the plaintext image (so the Worker can run OCR via Claude vision). The encrypted copy on the device is the long-term store; the plaintext is discarded server-side after extraction.

The user sees this stated plainly in a one-time consent modal before first chat use, and again before first prescription upload. Consent is versioned (`chat_v1`, `prescription_v1`); a policy bump forces re-prompt.

### Why this shape

- **Managed agent backend** (Worker + DO) — required by the user's choice. Lets us run the Anthropic tool-call loop server-side with one Durable Object per conversation, which gives serialised writes, message persistence, and the ability to checkpoint between turns.
- **Hybrid privacy** — explicit user choice after we flagged that "managed agent + on-device-only" is mutually exclusive. Cycle data is summarised on-device; only the summary is sent. Prescriptions are encrypted on-device for long-term storage; plaintext only travels to the Worker during the OCR step.
- **Anonymous device-ID auth** — matches the existing offline-first feel. No signup screen, no email provider. UUID is generated on first launch and held in `expo-secure-store`.

## Data model

### On-device (encrypted SQLite via `op-sqlite` + SQLCipher)

```sql
CREATE TABLE conversations (
  id           TEXT PRIMARY KEY,    -- ULID
  title        TEXT NOT NULL,       -- auto-generated from first user msg, editable
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  sync_status  TEXT NOT NULL        -- 'local' | 'synced' | 'pending'
);

CREATE TABLE messages (
  id              TEXT PRIMARY KEY, -- ULID
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,    -- 'user' | 'assistant' | 'tool_result'
  content_json    TEXT NOT NULL,    -- Anthropic-style content blocks
  created_at      INTEGER NOT NULL,
  status          TEXT NOT NULL     -- 'pending' | 'streaming' | 'complete' | 'error'
);

CREATE TABLE prescriptions (
  id              TEXT PRIMARY KEY, -- ULID
  file_path       TEXT NOT NULL,    -- documentDirectory path to encrypted blob
  file_mime       TEXT NOT NULL,    -- image/jpeg | application/pdf
  thumbnail_path  TEXT,             -- encrypted small thumb for the library list
  extracted_json  TEXT,             -- { drug, dosage, frequency, prescribed_on, doctor, raw_text }
  uploaded_at     INTEGER NOT NULL,
  sync_status     TEXT NOT NULL
);

CREATE TABLE pending_actions (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,    -- 'add_log' | 'schedule_reminder'
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL,    -- 'awaiting_user' | 'accepted' | 'declined'
  created_at      INTEGER NOT NULL
);

CREATE TABLE consent (
  key         TEXT PRIMARY KEY,     -- 'chat_v1' | 'prescription_v1'
  granted_at  INTEGER NOT NULL,
  version     INTEGER NOT NULL
);
```

Blobs (prescription images, PDFs, thumbnails) live in `expo-file-system` documentDirectory, AES-GCM encrypted with a key derived from the device master key in `expo-secure-store`.

### Backend D1

```sql
CREATE TABLE devices (
  id            TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL
);

CREATE TABLE conversations (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(id),
  title       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content_json    TEXT NOT NULL,
  created_at      INTEGER NOT NULL
);

CREATE TABLE prescriptions (
  id             TEXT PRIMARY KEY,
  device_id      TEXT NOT NULL REFERENCES devices(id),
  r2_key         TEXT NOT NULL,         -- R2 object key (24h staging; null/expired after lifecycle purge)
  extracted_json TEXT,                  -- structured OCR result
  uploaded_at    INTEGER NOT NULL
);
```

D1 is the source of truth for conversation history (lets the Durable Object replay the agent loop across restarts). Client mirrors locally for offline read. Conflicts resolved last-write-wins on `updated_at`.

### Cycle summary format

Built on-device before each chat request from existing `cycles`, `logs`, and `settings` stores. Target: ~300 tokens.

```
Recent cycles:
  - 2026-04-28 → 2026-05-02 (period, 5d), cycle length 28d
  - 2026-03-31 → 2026-04-04 (period, 5d), cycle length 28d
  - 2026-03-03 → 2026-03-07 (period, 5d), cycle length 28d
Current phase: luteal (high confidence, day 23 of 28)
Last 7 days symptoms: cramps, fatigue, headache
Flow this cycle: light × 1, medium × 3, heavy × 1
Cycle settings: average length 28d, period duration 5d
```

Raw note text is **not** included. Symptom tags only — never freeform notes — unless the user types them into chat themselves.

## Agent tools

The agent has four tools exposed by the Worker. Tools that mutate user data (the last two) return immediately with a "pending user confirmation" sentinel — the client surfaces an Approve / Decline card, and only on approval does the client perform the local write.

```ts
read_cycle_summary()
  -> { summary: string }
  // Worker echoes the summary the client sent in this request.

read_prescription_library()
  -> { prescriptions: ExtractedRx[] }
  // Worker queries D1 for this device's prescriptions.

add_daily_log({
  date: string,        // YYYY-MM-DD
  mood?: string,
  symptoms?: string[],
  flow?: 'light' | 'medium' | 'heavy',
  notes?: string,
})
  -> { status: 'pending_user_confirmation', action_id: string }

schedule_reminder({
  when: string,        // ISO datetime
  message: string,
})
  -> { status: 'pending_user_confirmation', action_id: string }
```

Reminder scheduling reuses the existing notifications system from
`docs/superpowers/specs/2026-05-02-notifications-reminders-design.md`.

## Screens & navigation

### Tab bar

Add a 4th tab `Chat` between `Calendar` and `Settings`. Floating tab bar already accommodates more items. Icon: speech bubble.

### `app/(tabs)/chat.tsx`

Segmented control at the top: **Chats** | **Library**.

**Chats segment**
- FlashList of conversations: title, last assistant message preview, timestamp, sync icon.
- FAB → new conversation → routes to `/chat/[id]` with a freshly created conversation row.
- Long-press → rename / delete sheet.
- Empty state: short copy explaining what the chat is for + a primary "Start chatting" button that opens the consent modal first.

**Library segment**
- Grid (2 columns) of prescription thumbnails. Overlay shows drug name + prescribed-on date once OCR is complete; spinner overlay while extraction is running.
- FAB → add prescription → action sheet (Take photo / Choose photo / Choose PDF).
  - First time: gates on the prescription-consent modal.
  - Image flow: `expo-image-picker` → `expo-image-manipulator` resize → upload.
  - PDF flow: `expo-document-picker` → upload as-is.
- Tap → `/prescription/[id]`.

### `app/chat/[id].tsx`

- FlashList of message bubbles (assistant left, user right, theme tokens).
- Composer at bottom: text input + paperclip (attach prescription from library or new image) + send.
- Streaming UX: typing indicator until `message_start`, then progressively-revealed text from `content_block_delta`.
- Tool-call rendering:
  - For read-only tools: inline "Reading your cycle data…" card while the tool runs, replaced with a subtle "✓ Used cycle data" footer once the assistant turn completes.
  - For pending-action tools: card with the proposed change + Approve / Decline buttons. Approval performs the local write and posts a `tool_result` back to the conversation.
- Persistent consent chip at top: "Powered by Claude — what we send →" opens a sheet showing the current cycle-summary that would be sent.
- Header: back button, conversation title (tap to rename), overflow menu (delete conversation).

### `app/prescription/[id].tsx`

- Full-screen image / PDF viewer (pinch to zoom).
- Extracted fields panel underneath: drug, dosage, frequency, prescribed-on, doctor.
- Actions: Edit extracted fields, Delete, "Ask AI about this" (creates a new conversation pre-attached with this prescription as the first user-message attachment).

### `app/consent/chat.tsx` & `app/consent/prescription.tsx`

Full-screen modals shown on first use of each category. Each one lists:
- What data leaves the device (exact fields).
- Where it goes (Anthropic, named explicitly).
- What we don't do (sell, advertise, store after extraction for prescriptions).
- Primary action: "I understand, continue". Secondary: "Cancel".

Granting writes to the `consent` table with current version.

## Backend shape (`mht-backend/`)

```
mht-backend/
  src/
    index.ts                  -- router (Hono)
    routes/
      chat.ts                 -- POST /v1/conversations/:id/messages → SSE stream
      conversations.ts        -- GET/POST/PATCH/DELETE /v1/conversations
      prescriptions.ts        -- POST /v1/prescriptions (multipart) → OCR → JSON; GET list; DELETE
    durable/
      ConversationDO.ts       -- per-convo state, agent loop, streaming
    agent/
      runner.ts               -- toolRunner setup
      tools.ts                -- tool schemas + handlers
      prompts.ts              -- system prompt, safety guardrails, medical-disclaimer language
    storage/
      d1.ts                   -- queries
      r2.ts                   -- signed upload/download helpers
    auth/
      device.ts               -- bearer token validation, device upsert
  wrangler.toml
  schema.sql                  -- D1 migrations
  package.json
  tsconfig.json
```

### Auth

Client sends `Authorization: Bearer dev_<uuid>` on every request. Middleware validates format, upserts the device row, attaches `device_id` to the request context. There is no signup, no email, no password.

Abuse mitigation:
- Per-device rate limit (Workers Rate Limiting API): 60 chat turns/hour, 20 prescription uploads/day.
- Max prescription blob size: 10 MB.
- Max message length: 8 KB plus optional one image ≤ 5 MB.

### Streaming protocol

Worker streams Anthropic SSE pass-through to the client. Each `content_block_delta` is forwarded. Client uses `expo/fetch` ReadableStream → `TextDecoder` per chunk → naive SSE parser. Fallback to `react-native-sse` if `expo/fetch` proves unreliable on either platform.

Tool-call deltas are forwarded too, so the client can show the "Reading your cycle data…" card the moment a `tool_use` block starts.

### OCR pipeline (on prescription upload)

1. Client uploads plaintext image to `POST /v1/prescriptions` (multipart). Client keeps its own AES-GCM encrypted copy on-device — that is the authoritative long-term copy.
2. Worker stores the plaintext bytes in R2 under `r2_key = <device_id>/<prescription_id>` only long enough to run OCR. The R2 object has a lifecycle rule that deletes it 24 h after creation. (We deliberately do not persist plaintext server-side beyond that window; the device holds the encrypted authoritative copy.)
3. Worker calls Claude vision once with a strict JSON schema:
   ```json
   {
     "drug": "string",
     "dosage": "string",
     "frequency": "string",
     "prescribed_on": "YYYY-MM-DD or null",
     "doctor": "string or null",
     "raw_text": "string"
   }
   ```
4. JSON written to `prescriptions.extracted_json` in D1.
5. Response returned to client with the extracted JSON; client writes to local SQLite.
6. R2 plaintext object is auto-purged by the 24 h lifecycle rule.

If extraction fails or returns low-confidence fields, the prescription row still exists — the user can edit fields by hand in the detail screen.

## Encryption details (client)

```
expo-secure-store ──────► device_master_key (256-bit, generated on first launch)
                              │
                              ├──► SQLCipher passphrase for app DB
                              ├──► AES-GCM key for prescription blobs
                              └──► HKDF-derived per-purpose subkeys as needed
```

- `op-sqlite` opens the DB with the master key as SQLCipher passphrase.
- Prescription blobs: each file is encrypted independently with AES-GCM (96-bit nonce, 128-bit tag) using `react-native-quick-crypto`. Nonce stored in the first 12 bytes of the file. Tag in the last 16.
- Thumbnails encrypted the same way.
- Migration: on first launch after upgrade, existing AsyncStorage data (settings, cycles, logs) is read once and re-written into SQLCipher; AsyncStorage cleared.

## Build sequence

Five phases. Each is independently mergeable to the feature branch. Each phase has its own commit and at least a manual smoke test before moving to the next.

### Phase 1 — Encryption + storage foundation (client)

- Install `op-sqlite`, `expo-secure-store`, `react-native-quick-crypto`.
- Generate / load device master key.
- SQLite schema + migrations (drizzle-orm or hand-rolled SQL).
- AES-GCM blob helpers.
- Migrate existing AsyncStorage data into SQLCipher.
- Unit tests for the crypto helpers.
- **Exit criteria:** app runs on a dev build, existing features (cycles, logs, settings) work against the encrypted DB.

### Phase 2 — Backend skeleton (`mht-backend/`)

- `wrangler init`, project layout above.
- D1 schema, R2 bucket, secrets (`ANTHROPIC_API_KEY`) configured.
- Device-auth middleware + `/v1/health`.
- Deploy to a dev environment, point client at it via env var.
- **Exit criteria:** client can call `/v1/health` end-to-end against the deployed Worker.

### Phase 3 — Chat MVP end-to-end

- Client: Chat tab, segmented control (Library segment shows "Coming soon" for now), conversations list, conversation detail, composer, FlashList bubbles.
- Backend: ConversationDO with Anthropic call (no tools yet) + cycle-summary injection.
- Streaming via `expo/fetch`.
- Two-step consent modal (only chat side for now).
- **Exit criteria:** user can chat, see streamed responses, conversations persist locally and on the backend.

### Phase 4 — Prescriptions + OCR

- Library view, action-sheet pickers, image resize.
- Upload endpoint, R2 storage, OCR pipeline, structured JSON storage.
- Prescription detail screen with edit-fields.
- Prescription consent modal on first upload.
- "Ask AI about this" deep-link from prescription detail.
- **Exit criteria:** user can upload a prescription, OCR completes, structured fields shown, prescription attaches to a new chat.

### Phase 5 — Agent tools

- Tool schemas + handlers in `mht-backend`.
- Anthropic `toolRunner` wired into ConversationDO.
- Client renders read-only tool cards, pending-action approval cards.
- Integrate `schedule_reminder` with the notifications system from the existing reminders spec.
- End-to-end QA on iOS + Android dev builds.
- **Exit criteria:** agent can read cycle/prescription data and propose log/reminder writes that the user approves.

## Open questions / decisions deferred to the plan stage

- Drizzle-orm vs hand-rolled SQL on the client. (Likely hand-rolled — small schema.)
- Exact Anthropic model — likely `claude-sonnet-4-6` for the agent and `claude-haiku-4-5` for OCR (cheaper, vision-capable). Plan stage will pin.
- Whether D1 conversation rows are written eagerly per turn or batched on conversation end.
- Whether the consent modal shows a live preview of the cycle-summary text or just describes it abstractly.
- Whether prescriptions get a separate consent for OCR vs storage, or one combined consent.

## Decisions log

Decisions reached during brainstorm on 2026-05-21:

- **Provider:** Anthropic Claude.
- **Backend host:** Cloudflare Workers + Durable Objects + D1 + R2, in a sibling project `mht-backend`.
- **Privacy model:** hybrid — local summary, encrypted prescriptions, plaintext only on the OCR hop.
- **Auth:** anonymous device UUID.
- **Navigation:** new `Chat` tab; prescriptions live inside the Chat tab as a segmented "Library" view.
- **Conversations:** multiple named conversations.
- **OCR timing:** on upload, in the background, structured JSON stored.
- **Agent tools:** `read_cycle_summary`, `read_prescription_library`, `add_daily_log`, `schedule_reminder`.

## References

- `cloudflare/agents-starter` — Workers + Anthropic agent reference.
- `cloudflare/agents` repo `guides/anthropic-patterns/` — patterns for tool-call loops on Workers.
- Existing project specs: `2026-04-07-menstrual-health-tracker-design.md`, `2026-05-02-notifications-reminders-design.md`.
- Project guidelines: `CLAUDE.md` at repo root.
