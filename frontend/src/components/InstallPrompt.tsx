import { useState } from "react";
import { useStoreConfig } from "../config/store";
import { Icons, Modal, useToast } from "./ui";
import { usePwaInstall } from "../hooks/usePwaInstall";

/**
 * Offers PWA installation to visitors who have not installed the app yet.
 * Dismissing is remembered, so it is only re-offered after two weeks.
 */
export default function InstallPrompt() {
  const {
    visible,
    installed,
    canPrompt,
    showInstructions,
    dismiss,
    install,
  } = usePwaInstall();
  const { push } = useToast();
  const { name } = useStoreConfig();
  const [busy, setBusy] = useState(false);

  if (installed || !visible) return null;

  async function onInstall() {
    setBusy(true);
    try {
      const outcome = await install();
      if (outcome === "accepted") push("Installing the app…", "success");
      if (outcome === "dismissed")
        push("You can install the app later from your browser menu.", "info");
    } catch {
      push(
        "Could not start the install. Try it from your browser menu.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={dismiss}
      title={`Install ${name}`}
      labelledBy="install-prompt-title"
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={dismiss}
            disabled={busy}
          >
            Not now
          </button>
          {canPrompt && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onInstall}
              disabled={busy}
            >
              {busy ? "Installing…" : "Install app"}
            </button>
          )}
        </>
      }
    >
      <div className="install-prompt">
        <div className="install-prompt__icon" aria-hidden="true">
          <Icons.Box size={28} />
        </div>
        <p>
          <strong>Add {name} to your home screen.</strong> Shop faster with full
          screen browsing, quick offline access to the app shell, and no app
          store needed.
        </p>
        {showInstructions && (
          <ol className="install-prompt__steps">
            <li>
              Tap the <strong>Share</strong> button in your Safari toolbar.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong> to install the app.
            </li>
          </ol>
        )}
      </div>
    </Modal>
  );
}
