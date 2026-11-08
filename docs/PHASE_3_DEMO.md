# Try missed-call recovery

Open **https://leadrescue-nu.vercel.app/demo/simulator**, or choose **Recovery demo** in the sidebar after the latest Vercel deployment is ready.

This update needs **no SQL scripts, new keys, phone purchases, or provider accounts**. Your existing business records stay separate. The simulator uses fictional customers, and nothing is sent to anyone.

## Your first recovery

1. Leave **WhatsApp recovery** selected and click **Prepare test case**.
2. Review the fictional customer’s permissions and the message preview. Click **Start incoming call**.
3. Leave the outcome as **Not answered**, then click **Finish simulated call**.
4. Click **Simulate delivery**, then **Simulate customer reply**.
5. Use **Open demo inbox** to try a manual reply. Return using **Recovery demo** in the sidebar.
6. Click **Book demo appointment**, choose the time, and save.
7. Click **Mark lead as won**. **Confirmed recovered** should change to **1**.
8. Open the demo Overview. The call, its status, and the activity chart now reflect your simulated actions. Refresh to check persistence.

Appointments use the demo business’s timezone. Change that in demo **Settings** if needed. Use **Make it yours** in the demo banner to create your own demo business preferences.

## Try another outcome

| Test case           | What to expect                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| SMS fallback        | WhatsApp is unavailable. SMS is selected only because the fictional customer has separate SMS permission and the sender is ready. |
| No permission       | The call is recorded for manual review; no follow-up message is created.                                                          |
| Customer opted out  | Both channels stay blocked, even when their permission switches are checked.                                                      |
| Delivery failure    | Choose **Simulate delivery failure**. No automatic retry or SMS resend appears.                                                   |
| Duplicate event     | Choose **Replay duplicate call event**. The attempt and message totals stay the same.                                             |
| Answered call       | The call counts as answered; no recovery starts.                                                                                  |
| Voicemail screening | Screening makes voicemail a missed call. Disable screening in **Demo settings** before starting another call to compare.          |

**Simulate STOP** records an opt-out and blocks further replies from the demo inbox. It also cancels any queued recovery for that fictional customer. A new missed call does not restore consent. You can explicitly reset fictional consent in **Edit demo permissions** or prepare a new test case.

## Delays and reply windows

In **Demo settings**, choose WhatsApp only, SMS only, or WhatsApp first with eligible SMS fallback. You can test sender readiness, SMS registration, approved WhatsApp templates, message wording, a delay of 0–3600 seconds, and call screening.

The simulator uses a displayed demo clock. **Advance to send time** processes a queued follow-up, checking eligibility again. **Advance 24 hours** lets you test the expiry of a WhatsApp reply window. A free-text inbox reply requires an open window; an incoming WhatsApp message alone does not grant messaging consent.

These switches model fictional conditions. Checking “approved template” does not submit or approve a real WhatsApp template.

## What is saved

Calls, event history, settings, fictional permissions, messages, leads, and bookings stay in this browser’s demo storage. Existing demo customer records are retained when this update first loads. Another browser or device has a separate demo. Clearing browser site data removes it. The demo holds up to 500 calls and retains the newest 500 event-log entries.

Results exclude the sample conversations that were already in the demo. Calls and automatic attempts are counted once per call; message totals include manual simulator replies. A delivery failure counts as an attempted message, never a recovered customer. Confirmed recovery requires an explicitly won lead with a linked reply and booking. Moving or canceling that linked booking removes its recovery link. Calendar charts use the business timezone.

Real calls and messaging are still not connected. The next implementation phase is phone forwarding and missed-call detection; real messaging follows with provider setup, recorded consent, approved senders/templates, and a durable hosted worker.
