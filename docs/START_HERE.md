# LeadRescue, in plain English

Open your app at **https://leadrescue-nu.vercel.app**. You do not need to write code to use it.

## What you can do now

Log in to manage your business. The new update lets you add leads, keep customer notes, organize conversation drafts, book appointments, and edit your business details. If you see “One last setup step,” follow [these short database update instructions](PHASE_2_SETUP.md).

The inbox currently saves drafts. It does not send WhatsApp messages or SMS. Connecting real calls and automatic messaging comes in later steps.

Choose **Watch demo** on the home page to explore fictional customers and simulate conversations without contacting anyone. Demo records stay in that browser; your logged-in business records are stored in your Supabase project.

## Try a complete missed-call recovery

Open [Recovery demo](https://leadrescue-nu.vercel.app/demo/simulator). Choose **Prepare test case**, start an incoming call, and finish it as not answered. Then simulate delivery and a customer reply, book a demo appointment, and mark the lead as won.

The results update as you go. You can also try SMS fallback, missing permission, STOP, failed delivery, and duplicate calls. [Follow the step-by-step guide](PHASE_3_DEMO.md).

**No new database script or account setup is needed for this update.** Your logged-in business remains separate from these fictional tests.

## Install it as an app

Open [Get the app](https://leadrescue-nu.vercel.app/install) and follow the instructions for your device:

- **Android:** In Chrome, open the three-dot menu → Add to Home screen → Install, or use “Install app” if shown.
- **Computer:** In Chrome or Microsoft Edge, use the install icon or the browser's app installation menu.

LeadRescue gets its own icon and opens in its own window. It still needs internet access. Browser support and menu labels vary. This is a browser-installed app; there is no separate APK, Windows installer, or app-store listing yet.

Your website runs on Vercel and your business data is stored in Supabase. Your personal computer does not need to stay on. A custom domain is optional.

## Animations

The update adds floating illustrations, animated dashboard numbers, and smooth card and conversation transitions. Use the pause icon next to the theme button to stop animations. Device reduced-motion preferences are respected automatically.
