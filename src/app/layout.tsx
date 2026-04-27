import type { Metadata } from "next";
import { AppPreferencesProvider } from "@/components/providers/AppPreferencesProvider";
import siteLogo from "./logo.png";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Research Discovery",
  description: "Discover scientific papers with intelligent insights",
  icons: {
    icon: [{ url: siteLogo.src, type: "image/png" }],
    shortcut: [siteLogo.src],
    apple: [siteLogo.src],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}
