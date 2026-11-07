"use client";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="container nav-row">
        <Brand />
        <nav
          className={`nav-links ${open ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <Link onClick={() => setOpen(false)} href="/#how-it-works">
            How it works
          </Link>
          <Link onClick={() => setOpen(false)} href="/#features">
            Features
          </Link>
          <Link onClick={() => setOpen(false)} href="/pricing">
            Pricing
          </Link>
          <Link onClick={() => setOpen(false)} href="/#faq">
            FAQs
          </Link>
          <Link onClick={() => setOpen(false)} href="/install">
            Get the app
          </Link>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link className="button small" href="/signup">
            Get started <ArrowUpRight size={16} />
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
