import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ASO Analyzer — App Store Keyword Research",
    template: "%s | ASO Analyzer",
  },
  description:
    "Free ASO tool for iOS developers. Research keywords, track competitors, and find keyword opportunities in the App Store.",
  keywords: [
    "ASO",
    "App Store Optimization",
    "keyword research",
    "iOS",
    "app marketing",
    "competitor analysis",
  ],
  openGraph: {
    title: "ASO Analyzer — App Store Keyword Research",
    description:
      "Free ASO tool for iOS developers. Research keywords, track competitors, and find keyword opportunities.",
    url: "https://aso-analyzer.pages.dev",
    siteName: "ASO Analyzer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASO Analyzer — App Store Keyword Research",
    description:
      "Free ASO tool for iOS developers. Research keywords, track competitors, and find keyword opportunities.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
