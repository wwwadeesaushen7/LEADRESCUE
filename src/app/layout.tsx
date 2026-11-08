import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallProvider } from "@/components/install-provider";
export const viewport: Viewport = { themeColor: "#6950da" };
export const metadata: Metadata = {
  title: {
    default: "LeadRescue — Every call is an opportunity",
    template: "%s | LeadRescue",
  },
  description:
    "Never lose a customer to a missed call again. WhatsApp and SMS follow-up for small businesses.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('leadrescue-theme')||'light';document.documentElement.dataset.motion=localStorage.getItem('leadrescue-motion')||'on'}catch(e){}",
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <InstallProvider>{children}</InstallProvider>
      </body>
    </html>
  );
}
