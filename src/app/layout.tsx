import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: `${PRODUCT}: ${TAGLINE}`,
  description: "Internal agency operating system, capture inbox, and grounded AI assistant for made. by ac.",
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
