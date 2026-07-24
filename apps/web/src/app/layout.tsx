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
  title: "AfriCover247 — AfriGlobal Digital Insurance Portal",
  description:
    "Browse, buy, and manage your AfriGlobal insurance policy entirely online. No office visits, no paperwork.",
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
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
