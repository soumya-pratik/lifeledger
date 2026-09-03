import { useEffect, useState } from "react";

const DISMISS_KEY = "lifeledger.installDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    if (isIos()) {
      setIosHint(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferred(null);
    setIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferred(null);
  }

  if (dismissed || isStandalone()) return null;
  if (!deferred && !iosHint) return null;

  return (
    <div className="border-t border-ll-border bg-ll-surface px-4 py-3 shadow-[var(--ll-shadow)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ll-text">Install LifeLedger</p>
          <p className="mt-0.5 text-xs text-ll-muted">
            {iosHint
              ? "Tap Share, then “Add to Home Screen” for quick access like a native app."
              : "Add to your home screen for offline access and a full-screen app experience."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!iosHint ? (
            <button
              type="button"
              onClick={() => void install()}
              className="rounded-xl bg-ll-accent px-4 py-2 text-sm font-semibold text-ll-accent-fg"
            >
              Install
            </button>
          ) : null}
          <button type="button" onClick={dismiss} className="rounded-xl px-4 py-2 text-sm text-ll-muted">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
