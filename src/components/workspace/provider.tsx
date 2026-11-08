"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import type { BusinessInput } from "@/lib/validation";
import { sampleBusiness } from "@/lib/demo/session-data";
import {
  emptyWorkspace,
  type WorkspaceData,
  type Command,
} from "@/lib/workspace/model";
import { seedWorkspace, applyDemoCommand } from "@/lib/workspace/demo";
const KEY = "leadrescue-workspace-v2";
type Context = {
  data: WorkspaceData;
  demo: boolean;
  loading: boolean;
  error: string;
  setupRequired: boolean;
  busy: boolean;
  run: (cmd: Command) => Promise<void>;
  refresh: () => void;
};
const WorkspaceContext = createContext<Context | null>(null);
export function WorkspaceProvider({
  demo,
  name,
  business,
  children,
}: {
  demo: boolean;
  name: string;
  business?: BusinessInput;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<WorkspaceData>(() =>
    emptyWorkspace(business || { ...sampleBusiness, name }),
  );
  const current = useRef(data),
    locked = useRef(false);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [setupRequired, setSetupRequired] = useState(false);
  const refresh = useCallback(
    (syncBusiness = false) => {
      let active = true;
      async function load() {
        setLoading(true);
        setError("");
        try {
          let next: WorkspaceData;
          if (demo) {
            const saved = localStorage.getItem(KEY);
            next = saved
              ? JSON.parse(saved)
              : seedWorkspace(business || { ...sampleBusiness, name });
            if (
              !Array.isArray(next.leads) ||
              !Array.isArray(next.messages) ||
              !next.business
            )
              throw new Error(
                "Demo storage is invalid. Clear site data to start again.",
              );
            if (syncBusiness)
              next.business = business || { ...next.business, name };
            localStorage.setItem(KEY, JSON.stringify(next));
          } else {
            const response = await fetch("/api/workspace", {
              cache: "no-store",
            });
            const result = await response.json();
            if (!response.ok) {
              if (active) setSetupRequired(result.code === "SETUP_REQUIRED");
              throw new Error(result.error);
            }
            next = result;
          }
          if (active) {
            current.current = next;
            setData(next);
            setSetupRequired(false);
          }
        } catch (err) {
          if (active)
            setError(
              err instanceof Error
                ? err.message
                : "Could not load your workspace.",
            );
        } finally {
          if (active) setLoading(false);
        }
      }
      void load();
      return () => {
        active = false;
      };
    },
    [demo, name, business],
  );
  useEffect(() => refresh(true), [refresh]);
  async function run(cmd: Command) {
    if (locked.current)
      throw new Error("Please wait for the current change to finish.");
    locked.current = true;
    setBusy(true);
    try {
      let next: WorkspaceData;
      if (demo) {
        next = applyDemoCommand(current.current, cmd);
        if (cmd.action === "saveBusiness") {
          const response = await fetch("/api/demo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cmd.data),
          });
          if (!response.ok)
            throw new Error("Could not save demo business settings.");
        }
        localStorage.setItem(KEY, JSON.stringify(next));
      } else {
        const response = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cmd),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        next = result;
      }
      current.current = next;
      setData(next);
      setError("");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <WorkspaceContext.Provider
      value={{ data, demo, loading, error, setupRequired, busy, run, refresh }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider required");
  return value;
}
