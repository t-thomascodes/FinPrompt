"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMO_SESSION_STORAGE_KEY,
  setDemoSessionActive,
} from "@/lib/demoSession";

const FULL_ACCESS_EMAIL = "tonythomas.dev@gmail.com";

type DemoGateProps = {
  children: React.ReactNode;
};

export function DemoGate({ children }: DemoGateProps) {
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(DEMO_SESSION_STORAGE_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
    setHydrated(true);
  }, []);

  const enterDemo = useCallback(() => {
    setDemoSessionActive();
    setUnlocked(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fp-bg text-fp-text-muted">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen flex-col bg-fp-bg text-fp-text-primary">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-fp-card border-[0.5px] border-fp-border bg-fp-surface p-8 shadow-fp-card sm:p-10">
            <div className="mb-6 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-fp-btn bg-fp-research font-mono text-xl font-bold text-white">
                M
              </div>
            </div>
            <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-fp-text-primary sm:text-2xl">
              Meridian
            </h1>
            <p className="mb-6 text-center text-[13px] leading-relaxed text-fp-text-secondary">
              An AI workflow layer for asset management. Browse research, risk,
              and operations templates, run them with your inputs, attach market
              context, and keep a structured log of outputs for review and
              analytics.
            </p>
            <button
              type="button"
              onClick={enterDemo}
              className="w-full rounded-fp-btn bg-fp-research py-3 text-sm font-semibold text-white shadow-fp-card transition-opacity hover:opacity-90 active:opacity-100"
            >
              Log in to demo account
            </button>
            <p className="mt-5 text-center text-[11px] leading-relaxed text-fp-text-muted">
              The demo is a shared exploration workspace. For full features and
              dedicated access, email{" "}
              <a
                href={`mailto:${FULL_ACCESS_EMAIL}?subject=Meridian%20full%20access`}
                className="font-medium text-fp-research underline decoration-fp-border underline-offset-2 hover:text-fp-data"
              >
                {FULL_ACCESS_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
