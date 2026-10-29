import type { Metadata } from "next";
import Script from "next/script";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Brand typeface (see the FlexoraCMS brand sheet).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FlexoraCMS",
    template: "%s — FlexoraCMS",
  },
  description: "The modern CMS for creative agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // flx-theme.js sets the `dark` class before hydration.
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
        <Script src="/flx-theme.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
