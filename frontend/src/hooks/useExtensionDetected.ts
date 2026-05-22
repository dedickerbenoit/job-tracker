import { useState, useEffect } from "react";

const STORAGE_KEY = "jt:extension-detected";
const EXTENSION_EVENT = "jobtracker:application-saved";

/**
 * Returns true when the Chrome extension has been detected during this
 * session or any previous session (persisted via localStorage).
 *
 * Detection signals:
 * - The extension dispatches a `jobtracker:application-saved` custom event
 * - The bootstrap script sets `window.__JT_HANDOFF_TOKEN__` (consumed by authStore)
 *
 * Call `markExtensionDetected()` from external code (e.g. authStore) to flag
 * the extension as present without waiting for a DOM event.
 */

export function markExtensionDetected(): void {
  localStorage.setItem(STORAGE_KEY, "1");
}

export function useExtensionDetected(): boolean {
  const [detected, setDetected] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );

  useEffect(() => {
    if (detected) return;

    const handler = () => {
      markExtensionDetected();
      setDetected(true);
    };

    window.addEventListener(EXTENSION_EVENT, handler);
    return () => window.removeEventListener(EXTENSION_EVENT, handler);
  }, [detected]);

  return detected;
}
