# Provider setup and launch preparation

These steps prepare later phases. **Phase 1 has no Twilio webhook endpoints, provider calls, active subscription billing, or live recovery worker.** Do not point a live number at invented endpoints. No paid service is activated by this repository.

## Twilio Voice (Phase 4)

After explicit account setup, choose a Twilio-supported number capable of Voice and messaging. Calls must route through that number; an ordinary mobile number alone cannot report missed calls. Store account credentials in server-side environment settings. Use the exact public webhook URL to verify Twilio signatures, including the actual URL and all submitted parameters. Reverse proxies must not change the signature validation URL.

Forward with TwiML `Dial` to the business number. Distinguish the incoming parent `CallSid` from the forwarded `DialCallSid`, and use the `Dial` action `DialCallStatus` to determine completed, no-answer, busy, failed, or canceled outcomes. Store and deduplicate both events and recovery decisions. A completed call can mean voicemail answered; optional press-1 call screening should confirm a human answer. Test actual behavior before making accuracy claims.

## WhatsApp Sandbox (Phase 5)

Use Twilio's official WhatsApp Sandbox first. Follow the current Console's join instructions with an explicitly consenting test phone. Configure the inbound and delivery callback URLs only after those signed routes are implemented. Sandbox participation is not production authorization. Production senders require the relevant Twilio/Meta verification and onboarding. A multi-business SaaS must plan for the appropriate Twilio and Meta Tech Provider processes; one-click customer onboarding is not implemented.

Record WhatsApp opt-in evidence independently of phone calls. Free-form business replies require an open 24-hour customer-service window based on actual inbound WhatsApp activity. Outside that window, use an approved content template. Enforce opt-outs immediately and test expiration boundaries with a controlled clock.

## SMS (Phase 5)

Complete appropriate US A2P 10DLC registration or applicable toll-free/other sender verification. Record SMS consent separately from WhatsApp consent. Enable provider opt-out features and also maintain application suppression records. Test STOP and applicable opt-out keywords, opt-in restoration rules, failed deliveries, and blocked recipients. Never infer SMS consent from WhatsApp authorization or from a missed call alone.

## Automation and durability

Use a persisted job queue with a hosted scheduled worker. Claim jobs with leases/locking, retry transient failures with bounded backoff, preserve event IDs, and expose failed jobs for operators. Prevent a second channel from being sent for the same recovery event. If a provider request times out after accepting a message, reconcile status instead of blindly retrying and creating a duplicate. Record every attempt without equating a sent message to a recovered customer.

## Production checklist (future launch gate)

- [ ] Validate hosted signup, verification, recovery, logout and tenant isolation with two real test accounts.
- [ ] Enable appropriate Supabase Auth rate limits, CAPTCHA and production email delivery. The current auth routes inherit Supabase rate limits; application-wide durable abuse controls remain Phase 6.
- [ ] Configure exact trusted origins, HTTPS, secure secrets and webhook URLs; review CSP and security headers.
- [ ] Review RLS and tenant-scoped relationships for all newly introduced tables.
- [ ] Complete sender registrations and store independent consent evidence and suppression policies.
- [ ] Test signed, duplicate, delayed, reordered, malformed and replayed webhooks.
- [ ] Test a real sandbox call, WhatsApp template, SMS response, opt-out, and delivery failure.
- [ ] Deploy durable workers and test restart/retry/reconciliation behavior.
- [ ] Add monitoring, privacy policy, terms, retention/deletion/export processes and tested backups.
- [ ] Review eligibility, quiet hours and opt-out policies for the actual service regions.
- [ ] Test Stripe billing and webhook authorization in test mode before offering subscriptions.
- [ ] Review admin access separately; do not expose private customer conversations by default.
- [ ] Load-test, audit dependencies and perform a production security review.

Passing local Phase 1 tests does not mark these launch gates complete.
