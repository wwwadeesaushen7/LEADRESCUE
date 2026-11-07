import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  PhoneMissed,
  MessageCircle,
  CalendarCheck,
  Check,
  Phone,
  Sparkles,
  ShieldCheck,
  Zap,
  Wrench,
  Wind,
  Car,
  Sprout,
  Droplets,
  ChevronRight,
  AudioLines,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { ActivityChart } from "@/components/activity-chart";
export default function Home() {
  return (
    <>
      <PublicNav />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <span className="pill">
              <span className="status-dot" /> BIG OPPORTUNITIES. SMALL BUSINESS
              ENERGY.
            </span>
            <h1>
              Every missed call
              <br />
              could be a{" "}
              <span>
                lost
                <br className="desktop-break" /> customer.
              </span>
            </h1>
            <p>
              LeadRescue helps your business automatically follow up with missed
              callers through WhatsApp and SMS, manage conversations, and turn
              more opportunities into paying customers.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/signup">
                Start free trial <ArrowUpRight size={18} />
              </Link>
              <Link className="button secondary" href="/demo">
                <span className="play-circle">
                  <Play size={12} fill="currentColor" />
                </span>
                Watch demo
              </Link>
            </div>
            <div className="hero-notes">
              <span>
                <Check size={14} />
                No credit card needed
              </span>
              <span>
                <Check size={14} />
                Try the free demo
              </span>
            </div>
            <p className="preview-note">
              Development preview · Live messaging is not enabled
            </p>
          </div>
          <div
            className="hero-visual"
            aria-label="Illustrative missed-call recovery example"
          >
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="floating-tag">
              <Sparkles size={14} /> A second chance to say hello.
            </div>
            <div className="call-alert">
              <div className="missed-icon">
                <PhoneMissed size={20} />
              </div>
              <div>
                <strong>Missed call</strong>
                <span>Alex Morgan · just now</span>
              </div>
              <span className="mini-label">DEMO</span>
            </div>
            <div className="connecting-line">
              <span />
              <span />
              <span />
            </div>
            <div className="phone-card">
              <div className="phone-top">
                <span className="business-avatar">
                  <Wrench size={20} />
                </span>
                <div>
                  <strong>Willow & Co. Plumbing</strong>
                  <small>
                    <span className="status-dot" /> WhatsApp Business · example
                  </small>
                </div>
                <MessageCircle size={21} />
              </div>
              <div className="phone-chat">
                <span className="date-label">TODAY</span>
                <div className="bubble outgoing">
                  Hi Alex! Sorry we missed your call. 👋
                  <br />
                  <br />
                  This is Willow & Co. Plumbing. How can we help you today?
                  <small>
                    10:42 AM <Check size={12} />
                    <Check size={12} />
                  </small>
                </div>
                <div className="bubble incoming">
                  Hi! Our kitchen sink is leaking. Could someone come by this
                  week?<small>10:43 AM</small>
                </div>
                <div className="typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <div className="phone-input">
                A conversation, not a missed opportunity.
                <span>
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </div>
            <div className="recovered-float">
              <span>
                <CalendarCheck size={20} />
              </span>
              <div>
                <strong>From missed call to booked.</strong>
                <small>That’s the LeadRescue idea.</small>
              </div>
            </div>
            <span className="consent-caption">
              <ShieldCheck size={12} /> Illustrated with customer messaging
              consent
            </span>
          </div>
        </section>
        <section className="industry-strip container">
          <p>FOR THE BUSINESSES THAT KEEP LIFE MOVING</p>
          <div>
            {[
              [Wrench, "Plumbing"],
              [Wind, "HVAC"],
              [Car, "Auto repair"],
              [Droplets, "Cleaning"],
              [Sprout, "Landscaping"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Wrench;
              return (
                <span key={String(label)}>
                  <I size={21} />
                  {String(label)}
                </span>
              );
            })}
          </div>
        </section>
        <section className="section how-section" id="how-it-works">
          <div className="container">
            <div className="section-intro centered">
              <span className="eyebrow">LESS PHONE TAG. MORE POSSIBILITY.</span>
              <h2>
                You’re busy doing great work.
                <br />
                Let your follow-up keep up.
              </h2>
              <p>A simple path from “sorry we missed you” to “see you soon.”</p>
            </div>
            <div className="steps-grid">
              {[
                {
                  icon: PhoneMissed,
                  n: "01",
                  title: "A call goes unanswered",
                  text: "Calls through your connected Twilio number are forwarded to your business. An unanswered call starts the recovery process.",
                },
                {
                  icon: MessageCircle,
                  n: "02",
                  title: "Start a conversation",
                  text: "With customer consent, follow up through an eligible WhatsApp or SMS channel. No permission? Follow up manually.",
                },
                {
                  icon: CalendarCheck,
                  n: "03",
                  title: "Make the connection count",
                  text: "Keep replies, customer details, and appointments together. You confirm when an opportunity becomes a customer.",
                },
              ].map((s) => (
                <article className="step-card" key={s.n}>
                  <div className="step-top">
                    <span className="feature-icon">
                      <s.icon size={25} />
                    </span>
                    <span>{s.n}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section container feature-section" id="features">
          <div className="section-intro">
            <span className="eyebrow">
              ONE CALM PLACE FOR EVERY OPPORTUNITY
            </span>
            <h2>
              A little less chasing.
              <br />A lot more connecting.
            </h2>
            <p>
              A clear picture of your calls and conversations.
              <br />
              Built around the way small businesses work.
            </p>
            <Link className="text-link" href="/demo">
              Explore the dashboard <ArrowRight size={17} />
            </Link>
          </div>
          <div className="feature-preview">
            <div className="preview-heading">
              <span className="tiny-logo">
                <AudioLines size={15} />
              </span>
              <strong>Your business, at a glance</strong>
              <span className="tag">SIMULATED</span>
            </div>
            <div className="mini-stats">
              <div>
                <span>Missed calls</span>
                <strong>48</strong>
              </div>
              <div>
                <span>Customer replies</span>
                <strong>24</strong>
              </div>
              <div>
                <span>Confirmed recovered</span>
                <strong>8</strong>
              </div>
            </div>
            <ActivityChart />
          </div>
        </section>
        <section className="container channel-grid">
          <article className="channel-card whatsapp">
            <span className="feature-icon">
              <MessageCircle size={26} />
            </span>
            <span className="eyebrow">WHATSAPP BUSINESS</span>
            <h3>
              Meet them where
              <br />
              they already chat.
            </h3>
            <p>
              Friendly conversations through an authorized WhatsApp sender, with
              opt-in and approved templates when needed.
            </p>
            <span className="subtle-tag">
              Official Twilio integration · planned
            </span>
          </article>
          <article className="channel-card sms">
            <span className="feature-icon">
              <Phone size={26} />
            </span>
            <span className="eyebrow">SMART SMS FOLLOW-UP</span>
            <h3>
              A simple text.
              <br />A new opportunity.
            </h3>
            <p>
              When WhatsApp is unavailable, independently authorized SMS can
              help you connect. One eligible channel, one recovery message.
            </p>
            <span className="subtle-tag">
              Consent-first messaging · planned
            </span>
          </article>
          <article className="channel-card control">
            <span className="feature-icon">
              <ShieldCheck size={26} />
            </span>
            <span className="eyebrow">YOU’RE IN CONTROL</span>
            <h3>
              Your business.
              <br />
              Your boundaries.
            </h3>
            <p>
              Separate business workspaces, customer permissions, and clear
              outcomes. A sent message is never counted as a recovered customer.
            </p>
            <Link className="text-link" href="/signup">
              Make yourself at home <ArrowUpRight size={16} />
            </Link>
          </article>
        </section>
        <Pricing />
        <section className="section container faq-section" id="faq">
          <div className="section-intro">
            <span className="eyebrow">GOOD QUESTIONS</span>
            <h2>
              A few things
              <br />
              you might be wondering.
            </h2>
            <p>Here’s the honest version.</p>
          </div>
          <div className="faq-list">
            {[
              [
                "Can I try LeadRescue without paying?",
                "Yes. The Phase 1 demo dashboard and business setup work without an account, phone number, or API purchase. The complete call and messaging simulator is planned for Phase 3.",
              ],
              [
                "Does it work with my existing mobile number?",
                "Calls must pass through a supported telephony integration. The planned Twilio workflow forwards calls from a connected number to your business; it cannot detect calls made directly to an ordinary mobile number.",
              ],
              [
                "Will a missed call automatically send a message?",
                "Only when the customer has given the relevant messaging permission and the sender is configured. A missed call alone does not provide WhatsApp or SMS consent. Real messaging is not enabled in Phase 1.",
              ],
              [
                "What do I need for WhatsApp and SMS?",
                "You will need Twilio setup, an authorized WhatsApp sender, appropriate templates, customer consent, and applicable US sender registration. Detailed integration work is planned for Phases 4 and 5.",
              ],
              [
                "Are payments or subscriptions active?",
                "No. Prices are provisional and no payment details are collected. Stripe billing will be implemented and tested in a later phase.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronRight size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container final-cta">
          <span className="pill">
            <Zap size={13} /> YOUR NEXT OPPORTUNITY IS CALLING
          </span>
          <h2>
            Let’s turn “missed you”
            <br />
            into “how can we help?”
          </h2>
          <p>Never lose a customer to a missed call again.</p>
          <Link href="/demo" className="button">
            Explore the free demo <ArrowUpRight size={18} />
          </Link>
          <span className="cta-spark spark-one">✳</span>
          <span className="cta-spark spark-two">✳</span>
        </section>
      </main>
      <Footer />
    </>
  );
}
