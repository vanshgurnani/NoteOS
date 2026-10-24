// Merge these fields into the existing Metadata object in frontend/app/layout.tsx.
// Do not replace the existing title or description.
export const pwaMetadata = {
  applicationName: "NOTE OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NOTE OS",
    statusBarStyle: "default" as const,
  },
};
