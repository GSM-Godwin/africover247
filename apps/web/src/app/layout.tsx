import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body-family",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "AfriCover247 — Digital Insurance by AfriGlobal",
    template: "%s — AfriCover247",
  },
  description:
    "Browse, apply, and manage your insurance policy entirely online. Motor, Health, Property and more — powered by AfriGlobal Insurance Brokers Limited, NAICOM licensed.",
  keywords: [
    "insurance Nigeria",
    "motor insurance",
    "health insurance",
    "AfriGlobal",
    "NAICOM",
    "online insurance",
    "digital insurance",
    "AfriCover247",
  ],
  authors: [{ name: "AfriGlobal Insurance Brokers Limited" }],
  creator: "AfriGlobal Insurance Brokers Limited",
  publisher: "AfriGlobal Insurance Brokers Limited",
  metadataBase: new URL("https://africover247.com"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://africover247.com",
    siteName: "AfriCover247",
    title: "AfriCover247 — Digital Insurance by AfriGlobal",
    description:
      "Browse, apply, and manage your insurance policy entirely online. Powered by AfriGlobal Insurance Brokers Limited.",
    images: [
      {
        url: "/afriglobal_logo.png",
        width: 1200,
        height: 630,
        alt: "AfriCover247 — AfriGlobal Insurance Brokers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriCover247 — Digital Insurance by AfriGlobal",
    description:
      "Browse, apply, and manage your insurance policy entirely online.",
    images: ["/afriglobal_logo.png"],
  },
  icons: {
    icon: "/afriglobal_logo.png",
    shortcut: "/afriglobal_logo.png",
    apple: "/afriglobal_logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-midnight font-body antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
