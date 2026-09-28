import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "pwa:install-dismissed-at";
const INSTALLED_KEY = "pwa:install-completed";
/** Re-offer the prompt this long after the user said "not now". */
const REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode — the prompt just reappears next visit */
  }
}

export function isInstalled(): boolean {
  if (typeof window === "undefined") return true;
  if (readStorage(INSTALLED_KEY) === "1") return true;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iOS Safari never fires beforeinstallprompt, but supports Add to Home Screen. */
export function needsIosInstructions(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && safari;
}

function isDismissed(): boolean {
  const raw = readStorage(DISMISSED_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return true;
  return Date.now() - at < REMIND_AFTER_MS;
}

type PromptState = {
  /** true when a browser-native install prompt is waiting to be shown. */
  canPrompt: boolean;
  showInstructions: boolean;
  visible: boolean;
  installed: boolean;
  dismiss: () => void;
  markInstalled: () => void;
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

/**
 * Captures the `beforeinstallprompt` event so the app can offer installation
 * at a moment of its own choosing, and tracks the installed state.
 */
export function usePwaInstall(delayMs = 2500): PromptState {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isInstalled());
  const [canPrompt, setCanPrompt] = useState(false);
  const showInstructions = needsIosInstructions() && !canPrompt;

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setCanPrompt(true);
    };
    const onInstalled = () => {
      writeStorage(INSTALLED_KEY, "1");
      setInstalled(true);
      setVisible(false);
      setEvent(null);
      setCanPrompt(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Launched from the home screen: never ask again.
  useEffect(() => {
    const queries = [
      window.matchMedia?.("(display-mode: standalone)"),
      window.matchMedia?.("(display-mode: fullscreen)"),
    ].filter(Boolean) as MediaQueryList[];
    const onChange = () => {
      if (isInstalled()) {
        setInstalled(true);
        setVisible(false);
      }
    };
    queries.forEach((q) => q.addEventListener("change", onChange));
    return () =>
      queries.forEach((q) => q.removeEventListener("change", onChange));
  }, []);

  // Surface the prompt a moment after load, once eligibility is known.
  useEffect(() => {
    if (installed || (!canPrompt && !showInstructions) || isDismissed())
      return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [canPrompt, delayMs, installed, showInstructions]);

  const dismiss = useCallback(() => {
    writeStorage(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const markInstalled = useCallback(() => {
    writeStorage(INSTALLED_KEY, "1");
    setInstalled(true);
    setVisible(false);
  }, []);

  const install = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    setEvent(null);
    setCanPrompt(false);
    setVisible(false);
    if (outcome === "accepted") markInstalled();
    return outcome;
  }, [event, markInstalled]);

  return {
    canPrompt,
    showInstructions,
    visible,
    installed,
    dismiss,
    markInstalled,
    install,
  };
}
