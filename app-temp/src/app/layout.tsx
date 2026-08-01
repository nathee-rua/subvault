import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubVault - Subscription Tracker & Credential Vault",
  description: "Personal subscription tracker with encrypted credential vault. Track AI, VPN, streaming, and SaaS subscriptions securely.",
  keywords: ["subscription tracker", "credential vault", "password manager", "subscription management"],
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
