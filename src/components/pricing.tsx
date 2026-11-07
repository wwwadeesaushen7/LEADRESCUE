import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
const plans = [
  {
    name: "Starter",
    price: 19,
    description: "A little help for your growing business.",
    features: [
      "Basic activity dashboard",
      "WhatsApp or SMS support",
      "Missed-call tracking",
      "Essential lead management",
    ],
  },
  {
    name: "Growth",
    price: 49,
    description: "Keep more conversations moving.",
    features: [
      "Everything in Starter",
      "WhatsApp + SMS recovery",
      "Advanced analytics",
      "Appointment management",
    ],
  },
  {
    name: "Pro",
    price: 99,
    description: "More room for your whole team.",
    features: [
      "Everything in Growth",
      "Higher usage limits",
      "Team management",
      "AI assistance when available",
    ],
  },
];
export function Pricing() {
  return (
    <section className="section container" id="pricing">
      <div className="section-intro centered">
        <span className="eyebrow">SIMPLE PLANS, MORE POSSIBILITIES</span>
        <h2>
          Your next customer is worth
          <br />
          following up with.
        </h2>
        <p>Choose a plan that grows with your business.</p>
      </div>
      <div className="pricing-grid">
        {plans.map((p, i) => (
          <article
            className={`price-card ${i === 1 ? "featured" : ""}`}
            key={p.name}
          >
            {i === 1 && (
              <span className="plan-label">BUILT FOR GROWING BUSINESSES</span>
            )}
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <div className="price">
              ${p.price}
              <span>/ month</span>
            </div>
            <Link
              className={`button ${i === 1 ? "" : "secondary"}`}
              href="/signup"
            >
              Get started <ArrowUpRight size={16} />
            </Link>
            <ul>
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={16} />
                  {f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="pricing-note">
        Preview pricing. Plans, features, and limits are provisional. Telephony
        and messaging charges may apply.
        <br />
        Billing is not active in this development version. No payment details
        are collected.
      </p>
    </section>
  );
}
