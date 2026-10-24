"use client";

import { useEffect } from "react";

export function RegisterNoteOSServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        console.error("NOTE OS service worker registration failed:", error);
      });
  }, []);

  return null;
}
