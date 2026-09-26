import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "made. desk — Operating System",
    short_name: "made. desk",
    description: "Internal operating system, capture inbox, and grounded AI assistant for made. by ac.",
    start_url: "/inbox",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#16130f",
    orientation: "any",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Capture Inbox",
        url: "/inbox",
        description: "Ingest Instagram Reels, YouTube, and research notes",
      },
      {
        name: "Next Actions",
        url: "/actions",
        description: "Priority queue of agency tasks",
      },
      {
        name: "Playbooks & SOPs",
        url: "/playbooks",
        description: "Agency standard operating procedures",
      },
      {
        name: "Client Workspace",
        url: "/clients",
        description: "Client pipeline and onboarding checklists",
      },
      {
        name: "Grounded AI Assistant",
        url: "/assistant",
        description: "Studio AI answering from stored knowledge",
      },
    ],
  };
}
