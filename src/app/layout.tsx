import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { NotificationCenter } from "@/components/NotificationCenter";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Private Car Buyer | High-Margin Lead Ingestion",
  description: "Automated AI-powered lead discovery for car dealerships.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${outfit.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <NotificationCenter />
        {children}
      </body>
    </html>
  );
}
