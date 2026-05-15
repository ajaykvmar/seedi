import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "SEEDI — ASO Tool",
    template: "%s | SEEDI",
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
    title: "SEEDI — ASO Tool",
    description:
      "Free ASO tool for iOS developers. Research keywords, track competitors, and find keyword opportunities.",
    url: "https://seedi.pages.dev",
    siteName: "SEEDI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEEDI — ASO Tool",
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
