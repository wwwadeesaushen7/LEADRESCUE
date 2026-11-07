# LeadRescue development plan

Build and test one phase before progressing. This change implements **Phase 1**.

| Phase                       | Deliverables                                                                                                                                                                                              | Exit checks                                                                                                                                      | Status                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1 — Foundation              | Responsive landing/pricing, light/dark theme, Supabase authentication routes, email verification and reset flows, business onboarding, protected initial dashboard, tenant RLS, separate sample dashboard | Build, typecheck, lint, input/auth tests, PostgreSQL isolation tests, desktop/mobile browser tests; hosted auth verification after configuration | Implemented locally; hosted Supabase validation pending credentials |
| 2 — Business tools          | Contacts/leads, unified inbox, business editing, appointments, real analytics, notifications; add domain tables and cross-tenant foreign keys                                                             | Tenant isolation, CRUD, CSV safety, timezone/calendar tests, browser journeys                                                                    | Next                                                                |
| 3 — Complete demo simulator | Simulate call outcomes, consent, WhatsApp selection, independently authorized SMS fallback, no consent, STOP, delivery failures and duplicate events; full booking-to-won journey                         | Recovery policy unit tests plus end-to-end simulator tests; network guard proves zero provider traffic                                           | Planned                                                             |
| 4 — Voice                   | Signed Twilio webhook handlers, forwarding, parent/child call correlation, Dial action outcomes, voicemail screening, event deduplication                                                                 | Signed fixtures, replay tests, real sandbox forwarding tests with explicit account setup                                                         | Planned                                                             |
| 5 — Messaging               | WhatsApp templates/window rules, SMS registration gates, consent evidence, opt-outs, inbound threads, delivery statuses, durable jobs                                                                     | Policy matrix, webhook signatures, duplicate prevention, sandbox delivery/STOP tests                                                             | Planned                                                             |
| 6 — Operations              | Notification workflows, strictly authorized admin, role-based teams, suspension controls, durable rate limits, auditing, retention                                                                        | Adversarial tenant tests, queue recovery tests, admin authorization                                                                              | Planned                                                             |
| 7 — Launch                  | Stripe test-mode billing, optional manually approved AI, deployment, production review                                                                                                                    | Stripe webhook/replay tests, provider tests, backups, monitoring, launch checklist                                                               | Planned                                                             |

## Phase 1 boundaries

The demo is a real interactive dashboard with a server-backed business setup flow; its metrics and contacts are explicitly **simulated fixtures**. The complete recovery simulator belongs to Phase 3. Inbox, Leads, Appointments, and Automations show a roadmap explanation, not fake working controls. The initial live dashboard has zero activity until actual domain models and integrations are implemented.

One owner account creates one business in Phase 1. The schema supports memberships across independent businesses, but team invites and workspace switching are not implemented. Business details are collected and stored; live editing is Phase 2. Profile name editing is implemented. Working hours currently use one same-day schedule for the selected weekdays.

## Planned database expansion

Phase 1 tables: `profiles` (application user profile linked to Supabase `auth.users`), `businesses`, `memberships`, `business_settings`, `subscriptions`.

Phase 2–6 tables: `phone_numbers`, `contacts`, `calls`, `leads`, `conversations`, `messages`, `consent_records`, `opt_outs`, `appointments`, `automations`, `notifications`, `usage_records`, `webhook_events`, `background_jobs`. Each tenant-owned record must carry `business_id`, RLS and tenant-scoped foreign keys. Provider IDs/event keys and recovery-event keys need uniqueness constraints. Never put a service-role key in browser code.

## Integration contracts to implement

- `VoiceProvider`: verify raw incoming webhook; parse stable event IDs; generate forwarding response; correlate parent `CallSid` and forwarded `DialCallSid`.
- `MessagingProvider`: check sender capabilities; send eligible template/free-form message; parse inbound messages and status callbacks. Real and demo implementations share a consent-policy function.
- `RecoveryPolicy`: check suppression first, then per-channel consent and sender readiness; WhatsApp additionally needs an open customer-service window or approved template. Select **at most one channel** per recovery event. Delivery failure does not silently trigger SMS.
- `JobRunner`: durable storage, idempotent enqueue, claim/lease, retry/backoff, dead-letter state, provider reconciliation for uncertain send results. Use a hosted scheduler/worker such as Supabase Cron + Edge Functions or a hosted job provider, never a browser timer or in-memory queue for live sends.
- `AiAssistant`: return suggestions only, requiring manual approval. Read appointment availability from actual data; never invent slots or prices.

These contracts are a design for future phases, not integrations claimed to be working now.
