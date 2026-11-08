# LeadRescue development plan

Build and test one phase before progressing. This change implements **Phases 1–3**.

| Phase                       | Deliverables                                                                                                                                                                                              | Exit checks                                                                                                                                      | Status                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1 — Foundation              | Responsive landing/pricing, light/dark theme, Supabase authentication routes, email verification and reset flows, business onboarding, protected initial dashboard, tenant RLS, separate sample dashboard | Build, typecheck, lint, input/auth tests, PostgreSQL isolation tests, desktop/mobile browser tests; hosted auth verification after configuration | Implemented; owner has verified deployed login/onboarding        |
| 2 — Business tools          | Contacts/leads, unified inbox, business editing, appointments, real analytics, notifications; add domain tables and cross-tenant foreign keys                                                             | Tenant isolation, create/edit flows, CSV safety, timezone/calendar tests, browser journeys                                                       | Implemented; owner verified hosted lead, booking and draft flows |
| 3 — Complete demo simulator | Simulate call outcomes, consent, WhatsApp selection, independently authorized SMS fallback, no consent, STOP, delivery failures and duplicate events; full booking-to-won journey                         | Recovery policy unit tests plus end-to-end simulator tests; network guard proves zero provider traffic                                           | Implemented; no new migration required                           |
| 4 — Voice                   | Signed Twilio webhook handlers, forwarding, parent/child call correlation, Dial action outcomes, voicemail screening, event deduplication                                                                 | Signed fixtures, replay tests, real sandbox forwarding tests with explicit account setup                                                         | Planned                                                          |
| 5 — Messaging               | WhatsApp templates/window rules, SMS registration gates, consent evidence, opt-outs, inbound threads, delivery statuses, durable jobs                                                                     | Policy matrix, webhook signatures, duplicate prevention, sandbox delivery/STOP tests                                                             | Planned                                                          |
| 6 — Operations              | Notification workflows, strictly authorized admin, role-based teams, suspension controls, durable rate limits, auditing, retention                                                                        | Adversarial tenant tests, queue recovery tests, admin authorization                                                                              | Planned                                                          |
| 7 — Launch                  | Stripe test-mode billing, optional manually approved AI, deployment, production review                                                                                                                    | Stripe webhook/replay tests, provider tests, backups, monitoring, launch checklist                                                               | Planned                                                          |

## Current boundaries

The authenticated workspace stores leads, draft conversations, appointments, notifications, business details, and account profiles in Supabase. The overview counts customer records. Call charts remain empty until real telephony is integrated.

The separate demo stores fictional customer records in browser local storage and business preferences in a cookie. You can create/edit leads, simulate messages, book/cancel appointments, and save settings. The complete consent-aware recovery simulator is available at `/demo/simulator`. It stores call events, fictional permissions, decisions, delivery statuses, replies and recovery links in the same browser-local demo. Queued demo sends use an explicitly advanced simulation clock, with eligibility checked again before dispatch; no live background queue or provider calls exist. Dashboard call charts now aggregate these events using the business timezone. See [the simulator guide](PHASE_3_DEMO.md).

One owner account creates one business. Team invites and workspace switching are not implemented. A conversation assignee is only a name label. Each business has one shared appointment calendar; scheduled appointments cannot overlap. Business hours use one same-day schedule for the selected weekdays, and manual bookings do not enforce those hours. All appointment times are converted from the business timezone; repeated or missing daylight-saving times are rejected explicitly.

Live inbox messages are unsent drafts. Database constraints prevent changing them into delivered or incoming messages. Automations and real providers remain inactive.

## Planned database expansion

Phase 1 tables: `profiles` (application user profile linked to Supabase `auth.users`), `businesses`, `memberships`, `business_settings`, `subscriptions`.

Phase 2 tables: `leads`, `conversations`, `messages`, `appointments`, `notifications`.

Later-phase tables: `phone_numbers`, `contacts`, `calls`, `consent_records`, `opt_outs`, `automations`, `usage_records`, `webhook_events`, `background_jobs`. Each tenant-owned record must carry `business_id`, RLS and tenant-scoped foreign keys. Provider IDs/event keys and recovery-event keys need uniqueness constraints. Never put a service-role key in browser code.

## Integration contracts to implement

- `VoiceProvider`: verify raw incoming webhook; parse stable event IDs; generate forwarding response; correlate parent `CallSid` and forwarded `DialCallSid`.
- `MessagingProvider`: check sender capabilities; send eligible template/free-form message; parse inbound messages and status callbacks. Real and demo implementations share a consent-policy function.
- `RecoveryPolicy`: check suppression first, then per-channel consent and sender readiness; WhatsApp additionally needs an open customer-service window or approved template. Select **at most one channel** per recovery event. Delivery failure does not silently trigger SMS.
- `JobRunner`: durable storage, idempotent enqueue, claim/lease, retry/backoff, dead-letter state, provider reconciliation for uncertain send results. Use a hosted scheduler/worker such as Supabase Cron + Edge Functions or a hosted job provider, never a browser timer or in-memory queue for live sends.
- `AiAssistant`: return suggestions only, requiring manual approval. Read appointment availability from actual data; never invent slots or prices.

The pure `RecoveryPolicy` is implemented and tested by the simulator. The real provider adapters, webhook persistence, consent evidence storage, and hosted job runner remain future work. The browser simulation is not a live messaging service.
