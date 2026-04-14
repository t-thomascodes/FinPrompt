/** Browser localStorage key — demo entry gate (no password; exploration mode). */
export const DEMO_SESSION_STORAGE_KEY = "meridian:demo-session";

export function setDemoSessionActive(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_SESSION_STORAGE_KEY, "1");
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
}
