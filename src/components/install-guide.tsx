"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Monitor,
  Smartphone,
  Wifi,
} from "lucide-react";
import { useInstall } from "./install-provider";

export function InstallGuide() {
  const { available, installed, pending, message, install } = useInstall();
  return (
    <>
      <section className="install-hero card">
        <span className="feature-icon">
          <Download size={26} />
        </span>
        <span className="eyebrow">YOUR WORKSPACE, ONE TAP AWAY</span>
        <h1>
          Make LeadRescue
          <br />
          feel right at home.
        </h1>
        <p>
          Add LeadRescue to your Android phone or computer. Open it from your
          home screen or app menu, in its own window.
        </p>
        {installed ? (
          <div className="notice success" role="status">
            <CheckCircle2 size={20} />
            LeadRescue is installed or running as an app on this device.
          </div>
        ) : available ? (
          <button className="button" disabled={pending} onClick={install}>
            <Download size={18} />
            {pending ? "Opening install window…" : "Install LeadRescue"}
          </button>
        ) : (
          <div className="notice">
            Open the published LeadRescue address in Chrome or Edge, then follow
            the steps below. The install button appears here when your browser
            offers installation.
          </div>
        )}
        {message && (
          <p className="install-message" role="status">
            {message}
          </p>
        )}
        <Link href="/app" className="text-link">
          {installed ? "Open LeadRescue" : "Continue in your browser"}
          <ArrowUpRight size={16} />
        </Link>
        <span className="install-online">
          <Wifi size={14} />
          Internet access is required.
        </span>
      </section>
      <div className="install-options">
        <section className="card">
          <Smartphone className="install-device" size={28} />
          <h2>On Android</h2>
          <ol>
            <li>
              Open the LeadRescue website in <strong>Chrome</strong>.
            </li>
            <li>
              Tap the <strong>three-dot menu</strong> in Chrome.
            </li>
            <li>
              Choose <strong>Add to Home screen</strong>, then{" "}
              <strong>Install</strong>. Some versions show{" "}
              <strong>Install app</strong> directly.
            </li>
          </ol>
          <p>
            The LeadRescue icon will appear with your apps. A shortcut may be
            offered if full installation is unavailable.
          </p>
        </section>
        <section className="card">
          <Monitor className="install-device" size={28} />
          <h2>On your computer</h2>
          <ol>
            <li>
              Open the LeadRescue website in{" "}
              <strong>Chrome or Microsoft Edge</strong>.
            </li>
            <li>
              Click <strong>Install LeadRescue</strong> above when available, or
              the install icon in the address bar.
            </li>
            <li>
              Confirm <strong>Install</strong>. You can then open LeadRescue
              from your app menu.
            </li>
          </ol>
          <p>
            In Edge, you can also use the three-dot menu → Apps → Install this
            site as an app. Browser menus vary by version.
          </p>
        </section>
      </div>
      <section className="card install-explainer">
        <h2>First, give your app a web address.</h2>
        <p>
          If you’re viewing a development preview, the app needs to be published
          to a secure website before you can install it on your own phone or
          computer. Publishing the cloud development environment alone does not
          put the app online.
        </p>
        <p>
          You can try the demo as soon as the website is published. Live
          customer accounts, phone calls, and messaging need additional setup;
          installing the app does not activate them.
        </p>
        <Link className="button secondary" href="/demo">
          Try the free demo <ArrowUpRight size={16} />
        </Link>
      </section>
    </>
  );
}
