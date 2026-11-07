# BUILD LEADRESCUE — A COMPLETE WHATSAPP + SMS MISSED-CALL RECOVERY SAAS

You are a professional full-stack software engineer, SaaS architect, UI/UX designer, and technical mentor.

I want to create a professional SaaS application called **LeadRescue** from scratch.

TAGLINE: "Never lose a customer to a missed call again."

LeadRescue helps small businesses automatically follow up with customers who call but don't get an answer.

The platform must support BOTH WhatsApp Business and SMS messaging.

I want to eventually launch this as a real subscription-based SaaS business, initially targeting small businesses in the United States.

IMPORTANT:

- I am a beginner developer.
- Write clean, understandable, maintainable code.
- Explain the important setup steps.
- Do not generate only a website design.
- Build a functional application with a real backend.
- Include a complete demo mode so I can test everything without buying phone numbers or paying for API usage.
- Build and test the project in manageable phases.
- Do not activate paid services without my explicit action.

---

# 1. TECHNOLOGY STACK

Use:

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide icons

Backend:

- Next.js server-side API routes
- Supabase PostgreSQL
- Supabase Authentication

Communication:

- Twilio Programmable Voice
- Twilio Programmable SMS
- Twilio WhatsApp Business Platform integration

Hosting:

- Vercel-compatible frontend and API
- Supabase database
- Reliable hosted background jobs for queued automations

Use stable, compatible dependencies.

Keep the architecture modular so other providers can be integrated later.

---

# 2. WEBSITE DESIGN

Create a premium, professional SaaS website.

Design inspiration:

- Stripe
- Linear
- Vercel

Design requirements:

- Beautiful modern interface
- Dark and light mode
- Blue, purple, and white accent colors
- Elegant typography
- Smooth animations
- Responsive layouts
- Rounded components
- Modern icons
- Clean navigation
- Interactive charts
- Professional dashboard
- Excellent mobile experience

Avoid unnecessary complexity or distracting animations.

The website must work beautifully on phones, tablets, laptops, and desktop computers.

---

# 3. PUBLIC LANDING PAGE

Build a complete marketing website.

Include:

1. Navigation bar
2. Hero section
3. Product preview
4. How LeadRescue works
5. WhatsApp and SMS features
6. Benefits for businesses
7. Product screenshots or interactive demonstrations
8. Pricing section
9. FAQ section
10. Registration button
11. Login button
12. Footer

Main headline:

"Every Missed Call Could Be a Lost Customer."

Subheadline:

"LeadRescue helps your business automatically follow up with missed callers through WhatsApp and SMS, manage conversations, and turn more opportunities into paying customers."

Buttons:

- Start Free Trial
- Watch Demo
- Explore Features

Do not fabricate testimonials or customer statistics.

---

# 4. USER REGISTRATION AND LOGIN

Implement a complete authentication system.

Features:

- Create account
- Login
- Logout
- Forgot password
- Reset password
- Email verification
- Profile settings
- Protected dashboard

Use Supabase Authentication.

Support multiple independent businesses.

Each business must have its own private data.

Implement proper server-side authorization and database Row Level Security.

---

# 5. BUSINESS ONBOARDING

After registration, guide users through business setup.

Collect:

- Business name
- Industry
- Business phone number
- Business email
- Business location
- Timezone
- Working hours
- Website
- Business description

Business categories:

- Plumbing
- Electrical services
- Cleaning services
- Auto repair
- HVAC
- Landscaping
- Other businesses

Allow users to edit this information later.

Include an onboarding checklist showing which integrations still need configuration.

---

# 6. MAIN DASHBOARD

Create a beautiful dashboard containing:

Statistics:

- Total calls
- Answered calls
- Missed calls
- Recovery attempts
- WhatsApp messages
- SMS messages
- Customer replies
- New leads
- Booked appointments
- Confirmed recovered customers

Include:

- Daily activity graph
- Weekly activity graph
- Monthly activity graph
- Recent missed calls
- Latest conversations
- Lead conversion chart
- Notifications
- Quick actions

Use real data when integrations are connected.

Use clearly labeled simulated data in demo mode.

---

# 7. AUTOMATIC MISSED-CALL DETECTION

Integrate Twilio Programmable Voice.

Initial implementation:

1. The business configures a LeadRescue-compatible Twilio phone number.
2. Customers call that number.
3. Twilio routes the call through LeadRescue.
4. LeadRescue forwards the call to the business owner.
5. The application tracks the forwarding outcome.
6. If nobody answers, create a missed-call event.
7. Evaluate the customer's messaging permissions.
8. Start an eligible recovery workflow.

Support:

- Answered calls
- Unanswered calls
- Busy calls
- Failed calls
- Canceled calls

Important technical requirements:

Use the correct Twilio Dial status callbacks and call identifiers.

Handle voicemail answering as an edge case.

Consider an optional "press 1 to accept" call-screening feature to distinguish a real person answering from voicemail.

Do not claim to detect missed calls from ordinary mobile numbers unless those calls actually pass through a supported telephony integration.

Prevent duplicate call processing.

Implement secure webhook verification.

---

# 8. WHATSAPP + SMS SMART RECOVERY

This is the MOST IMPORTANT FEATURE of LeadRescue.

Build a smart communication system.

Allow businesses to select:

1. WhatsApp only
2. SMS only
3. WhatsApp + SMS

Default: WhatsApp + SMS.

For the third option, use the following logic.

When a call is missed:

STEP 1:
Check whether the customer has valid permission for WhatsApp messaging.

STEP 2:
Check whether the business has an active, authorized WhatsApp sender.

STEP 3:
Determine whether a customer-service window is open or an approved WhatsApp template is required and available.

STEP 4:
If all conditions are satisfied, send the WhatsApp recovery message.

STEP 5:
If WhatsApp is unavailable, check whether SMS messaging is independently authorized and properly configured.

STEP 6:
If SMS is eligible, send the SMS recovery message.

STEP 7:
If neither channel is permitted, notify the business owner to follow up manually.

Prevent duplicate messages.

Never send both messages automatically for the same recovery event.

Do not automatically retry through SMS after a WhatsApp delivery failure unless the fallback is allowed by the customer's permissions and the configured policy.

Track every recovery attempt.

Allow business owners to disable automatic messaging.

---

# 9. WHATSAPP BUSINESS INTEGRATION

Use the official WhatsApp Business Platform through Twilio.

Features:

- Connect an authorized WhatsApp Business sender
- Send approved template messages
- Receive WhatsApp messages
- Display customer conversations
- Reply to customers
- Track delivery statuses
- Handle failed messages
- Support WhatsApp opt-outs
- Save conversation histories

Provide a dedicated WhatsApp settings page.

Show:

- Connection status
- Sender number
- Sandbox mode
- Production mode
- Webhook status
- Template status
- Consent configuration

Use Twilio's WhatsApp Sandbox for testing.

Follow the WhatsApp 24-hour customer service window rules.

Use approved templates when required for business-initiated messages.

Require appropriate customer opt-in.

Do not assume a missed telephone call provides WhatsApp messaging consent.

Design future onboarding to accommodate multiple independent business customers using the appropriate Twilio and Meta Tech Provider processes.

Do not promise one-click WhatsApp integration before the relevant provider onboarding is implemented.

---

# 10. SMS INTEGRATION

Integrate Twilio Programmable Messaging.

Features:

- Automatic eligible missed-call SMS
- Incoming customer SMS
- Outgoing manual replies
- Customizable SMS templates
- Delivery tracking
- Failed message handling
- Customer opt-out controls

Example message:

"Hi! This is Mike's Plumbing. Sorry we missed your call. How can we help? Reply STOP to opt out."

Require appropriate messaging consent.

Support applicable opt-out keywords and suppression rules.

Provide setup guidance for US A2P 10DLC registration and other applicable sender verification requirements.

Do not enable real automatic SMS until required registration and consent configuration are completed.

---

# 11. UNIFIED CUSTOMER INBOX

Build one professional inbox for WhatsApp and SMS.

The interface should resemble a modern messaging platform.

Layout:

LEFT:

- Customer conversations
- Search bar
- Filters
- Unread message counts

CENTER:

- Selected conversation
- Message history
- Message composer
- Incoming/outgoing indicators
- Delivery status

RIGHT:

- Customer details
- Lead status
- Notes
- Appointment information
- Call history

Add recognizable WhatsApp and SMS channel labels.

Features:

- Read messages
- Send replies
- Search conversations
- Filter by channel
- Mark unread
- Add notes
- Update lead status
- Assign conversations
- View conversation history

Ensure that all messages belong to the correct business account.

---

# 12. CUSTOMER AND LEAD MANAGEMENT

Create a lightweight CRM.

Each lead should include:

- Customer name
- Phone number
- Contact source
- First contact date
- Last interaction
- WhatsApp history
- SMS history
- Call history
- Notes
- Appointment information
- Lead status

Lead statuses:

- New
- Contacted
- Interested
- Appointment Scheduled
- Won
- Lost

Allow manual and appropriate automated updates.

Add:

- Search
- Filters
- Lead details
- CSV export

Do not count a customer as recovered merely because a message was sent.

---

# 13. APPOINTMENT BOOKING

Build a simple appointment management system.

Business owners should be able to:

- Create appointments
- Choose date and time
- Add customer details
- Set appointment status
- Reschedule appointments
- Cancel appointments
- View upcoming bookings

Connect appointments to leads and conversations.

Add a calendar-style view.

Automated reminders should be disabled until the customer has the relevant messaging permission.

---

# 14. NOTIFICATIONS

Create notifications for:

- Missed calls
- Incoming WhatsApp messages
- Incoming SMS messages
- New leads
- Appointment requests
- Message delivery failures
- Integration problems

Use in-app notifications first.

Design the system so optional email and push notifications can be added later.

---

# 15. AUTOMATION SETTINGS

Provide a settings page.

Include:

- Enable/disable automatic recovery
- WhatsApp only
- SMS only
- WhatsApp + SMS
- Recovery message templates
- Business working hours
- Business timezone
- Response delay
- Duplicate prevention
- Consent settings
- Forwarding phone number
- Notification preferences
- Automation logs

Allow users to preview messages before activating them.

---

# 16. AI REPLY ASSISTANT

Create the architecture for an optional AI assistant.

Features:

- Suggest customer replies
- Summarize conversations
- Identify customer requests
- Suggest appointment times from actual availability
- Generate suggested follow-up messages

Initially, AI suggestions must require manual approval.

Do not automatically send AI-generated messages.

Do not invent appointment availability, prices, or completed bookings.

Make the AI provider configurable.

This feature can be implemented after the main system works.

---

# 17. PRICING SYSTEM

Create a beautiful pricing page.

Initial example plans:

STARTER — $19/month

- Basic dashboard
- Missed-call tracking
- WhatsApp or SMS support
- Basic lead management

GROWTH — $49/month

- WhatsApp + SMS
- Smart recovery
- Advanced analytics
- Appointments
- More usage capacity

PRO — $99/month

- Higher limits
- Team management
- Advanced automations
- AI assistance when available

Treat prices and usage limits as provisional.

Clearly explain that telephony and messaging charges may apply.

Use Stripe for future payment integration.

For the initial development version, build pricing UI and subscription-ready database structures.

Do not activate real payments until billing is properly implemented and tested.

---

# 18. ADMINISTRATOR DASHBOARD

Create a private administrator area.

Features:

- View businesses
- View account statuses
- Manage plans
- View system usage
- Monitor integration health
- Monitor failed jobs
- Manage account suspensions
- Review support issues

Use strict role-based authorization.

Do not expose private customer conversations unnecessarily.

---

# 19. FULL DEMO MODE

Extremely important.

I need to test LeadRescue without paying for Twilio or registering WhatsApp Business.

Create an interactive demo.

Allow me to:

1. Create a demo business.
2. Simulate an incoming phone call.
3. Simulate a missed call.
4. Select WhatsApp + SMS mode.
5. Simulate the customer's consent.
6. Preview the selected recovery message.
7. Simulate WhatsApp delivery.
8. Simulate an incoming customer reply.
9. Open the conversation inbox.
10. Reply to the customer.
11. Create a lead.
12. Schedule an appointment.
13. Mark the lead as won.
14. Watch the dashboard statistics update.

Also allow me to test:

- WhatsApp unavailable
- SMS fallback
- No messaging consent
- Customer opt-out
- Message delivery failure
- Duplicate missed-call events

Demo mode must not trigger real telephone calls or send real messages.

Make the entire demo workflow functional, not just visually interactive.

---

# 20. DATABASE

Use Supabase PostgreSQL.

Create tables for:

- Users
- Businesses
- Memberships
- Business settings
- Phone numbers
- Contacts
- Calls
- Leads
- Conversations
- Messages
- Consent records
- Opt-outs
- Appointments
- Automations
- Notifications
- Subscriptions
- Usage records
- Webhook events
- Background jobs

Implement appropriate indexes and relationships.

Use Row Level Security.

Keep each business's data private.

---

# 21. SECURITY AND RELIABILITY

Implement:

- Secure authentication
- Server-side authorization
- Input validation
- Environment variables
- Secure API credential handling
- Webhook signature validation
- Rate limiting
- Duplicate event protection
- Messaging consent enforcement
- Opt-out enforcement
- Background job retries
- Appropriate error handling
- Data privacy protections

Store API credentials only in server-side configuration.

Provide `.env.example`.

Do not include actual secret keys in source code.

Use durable background processing so scheduled tasks work without the user's PC being online.

---

# 22. PROJECT ORGANIZATION

Use a clean folder structure.

Separate:

- User interface components
- Pages
- API routes
- Authentication
- Database services
- Twilio integration
- WhatsApp integration
- SMS integration
- Call management
- Lead management
- Automation logic
- Demo services
- Shared utilities
- Tests

Keep files understandable and maintainable.

Avoid overly complicated abstractions.

---

# 23. DEVELOPMENT PHASES

Build the application step by step.

PHASE 1:

- Initialize project
- Create landing page
- Implement responsive design
- Add authentication
- Configure database
- Create business onboarding
- Build initial dashboard

PHASE 2:

- Lead management
- Unified inbox
- Appointments
- Business settings
- Dashboard analytics

PHASE 3:

- Complete interactive demo mode
- Simulated incoming calls
- Simulated WhatsApp and SMS
- Simulated recovery automation

PHASE 4:

- Twilio Voice integration
- Real call forwarding
- Missed-call detection
- Call status handling

PHASE 5:

- Twilio SMS integration
- WhatsApp Sandbox integration
- Consent management
- Messaging automation
- Delivery tracking

PHASE 6:

- Notifications
- Administrative dashboard
- Security improvements
- Reliability testing

PHASE 7:

- Subscription billing
- Optional AI assistance
- Production deployment
- Final testing

Do not attempt to build every phase in one giant change.

Complete and test each phase before progressing.

---

# 24. TESTING REQUIREMENTS

Create tests for:

- Authentication
- Business isolation
- Call outcomes
- Missed-call detection
- WhatsApp selection
- SMS fallback
- Consent checks
- Opt-outs
- Duplicate messages
- Incoming conversations
- Appointment creation
- Demo mode

Make sure the app builds successfully.

Clearly distinguish between simulated tests and real integration tests.

---

# 25. DEPLOYMENT

Prepare the application for deployment.

Provide:

- Local development instructions
- Supabase setup instructions
- Twilio setup instructions
- WhatsApp Sandbox instructions
- Environment variable instructions
- Vercel deployment instructions
- Production checklist

The production application must work without my personal computer running.

---

# 26. IMPORTANT FINAL INSTRUCTIONS

Remember, I am a beginner.

I want to build a serious SaaS business with this project.

Do not simply generate mockups.

Build working features.

If external services are unavailable, use proper integration interfaces and functional simulated implementations.

Do not pretend external integrations work until they have been tested.

Always explain what has been implemented.

START NOW:

1. Inspect the current project directory.
2. Create the LeadRescue project if the directory is empty.
3. Explain the architecture.
4. Create a development plan.
5. Begin implementing PHASE 1.
6. Run available tests.
7. Show me how to launch the app locally.
8. Explain what I need to do next.

Do not wait for additional instructions before beginning Phase 1.
