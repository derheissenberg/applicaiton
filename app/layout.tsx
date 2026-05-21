import type { Metadata } from "next";
import { Kode_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "400", "500", "600", "700"],
});

const kodeMono = Kode_Mono({
  subsets: ["latin"],
  variable: "--font-kode-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stefan Heißenberg",
  description: "Head of Design at DHL Group. 15+ years in digital product work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${kodeMono.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
