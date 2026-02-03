import type { Metadata } from "next";
import { Inter, Outfit, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "Cinelock | Cinematic Frame Generation",
  description: "One Prompt. Perfectly Consistent Frames.",
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${outfit.variable} ${cinzel.variable} antialiased bg-cinelock-dark text-cream-white`}
        >
          <div className="bg-noise" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
