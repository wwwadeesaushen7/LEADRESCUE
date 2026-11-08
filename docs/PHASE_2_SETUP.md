# Enable the new business tools

Your login and business account already work. This update adds leads, conversation drafts, appointments, and notifications. It needs one new database script.

1. Open [0002_business_tools.sql on GitHub](https://github.com/wwwadeesaushen7/LEADRESCUE/blob/main/supabase/migrations/0002_business_tools.sql).
2. Copy the entire file using GitHub's **Copy raw file** button.
3. In your existing **leadrescue Supabase project**, open **SQL Editor → New query**.
4. Paste the script and click **Run** once. The expected result is **Success. No rows returned**.
5. After Vercel finishes the updated deployment, refresh https://leadrescue-nu.vercel.app/dashboard.

Use the same Supabase project you connected to Vercel. Do not rerun 0001 or create another project. No new environment variables, API keys, or purchases are needed. This script adds tables and functions; it does not delete your existing account or business.

If SQL reports an error, keep its exact text. Do not delete existing tables or rerun the old setup to try to fix it. An “already exists” error may mean this script was already applied.

## Try the update

- **Leads:** Add a customer using a phone number with its country code, such as `+14155550100`. Save notes and change the lead status. Search or export the filtered list as CSV.
- **Inbox:** Create a conversation for a saved lead. Write a reply and choose **Save draft**. Nothing is sent to the customer.
- **Appointments:** Choose a customer, title, and time. Times use your business timezone. Scheduled appointments cannot overlap. You can edit, complete, or cancel a booking.
- **Settings:** Edit your business details, timezone, and working hours.
- **Notifications:** The bell shows new leads and appointment changes. Choose **Mark read** to clear the unread indicator.
- **Animations:** Use the pause icon near the theme button to stop the motion. Your device's reduced-motion setting is also respected.

Refresh after saving to check that your records persist. Sign in on another device to use the same live business data. The demo uses separate fictional data stored only in that browser.

Phone calls, automatic missed-call recovery, and real WhatsApp/SMS sending still need the later provider integrations. Installing the app does not enable those integrations.
