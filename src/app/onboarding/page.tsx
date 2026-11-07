import Link from "next/link";
import { Brand } from "@/components/brand";
import { BusinessForm } from "@/components/business-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/auth/session";
import { demoBusiness } from "@/lib/demo/session";
export const metadata = { title: "Set up your business" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const demo = (await searchParams).mode === "demo";
  if (!demo) await requireUser();
  return (
    <>
      <header className="container onboarding-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main id="main" className="onboarding-page">
        <Link className="back-link" href={demo ? "/demo" : "/dashboard"}>
          ← Back to dashboard
        </Link>
        <span className="eyebrow">
          {demo ? "YOUR DEMO WORKSPACE" : "WELCOME TO LEADRESCUE"}
        </span>
        <h1>Tell us about your business.</h1>
        <p>A few details to make this space feel like yours.</p>
        <div className="onboarding-progress">
          <span className="current">
            1 <strong>Business details</strong>
          </span>
          <i />
          <span>
            2 <strong>Your dashboard</strong>
          </span>
          <i />
          <span>
            3 <strong>Integrations later</strong>
          </span>
        </div>
        <BusinessForm
          demo={demo}
          initial={demo ? await demoBusiness() : undefined}
        />
      </main>
    </>
  );
}
