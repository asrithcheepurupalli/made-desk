import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, Space_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PRODUCT, TAGLINE } from "@/lib/brand";
import { hasClerk } from "@/lib/env";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#16130f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: `${PRODUCT}: ${TAGLINE}`,
  description: "Internal agency operating system, capture inbox, and grounded AI assistant for made. by ac.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "made. desk",
  },
  applicationName: "made. desk",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#f6f3ee] text-[#16130f]">
        {children}
      </body>
    </html>
  );

  if (hasClerk()) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
