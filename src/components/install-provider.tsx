"use client";

import { createContext, useContext, useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallState = {
  available: boolean;
  installed: boolean;
  pending: boolean;
  message: string;
  install: () => Promise<void>;
};
const InstallContext = createContext<InstallState | null>(null);

// Capture the browser's offer at the root so navigation to /install doesn't
// lose it. Installation always requires an explicit click and browser approval.
export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [offer, setOffer] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateDisplay = () => setInstalled(displayMode.matches);
    updateDisplay();
    const capture = (event: Event) => {
      event.preventDefault();
      setOffer(event as InstallPrompt);
    };
    const complete = () => {
      setInstalled(true);
      setOffer(null);
      setMessage(
        "LeadRescue is installed. Open it from your apps or home screen.",
      );
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    displayMode.addEventListener("change", updateDisplay);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
      displayMode.removeEventListener("change", updateDisplay);
    };
  }, []);

  async function install() {
    if (!offer || pending) return;
    setPending(true);
    setMessage("");
    try {
      await offer.prompt();
      const choice = await offer.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Installation accepted. Your browser will finish adding the app."
          : "No problem. You can keep using LeadRescue in your browser, or install it from the browser menu later.",
      );
    } catch {
      setMessage(
        "The install window could not open. Use your browser’s Install app menu instead.",
      );
    } finally {
      // A browser install prompt can be used only once.
      setOffer(null);
      setPending(false);
    }
  }

  return (
    <InstallContext.Provider
      value={{
        available: Boolean(offer),
        installed,
        pending,
        message,
        install,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("Install controls need InstallProvider.");
  return context;
}
