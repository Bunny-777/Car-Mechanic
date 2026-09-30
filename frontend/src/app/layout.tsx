import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Mechanic AI — Smart Automotive Diagnostics",
  description: "Chat with Mac, your AI-powered senior car mechanic. Describe symptoms, upload photos or audio, get structured diagnostic reports with INR cost estimates, and book certified mechanic appointments.",
  keywords: "car mechanic, automotive diagnosis, engine knock, brake squeal, check engine light, auto repair, book mechanic india",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
