import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "恋AI",
  description:
    "バーチャル女子大生「まき」とのリアルタイム会話で、きみのコミュ力爆上げしちゃおう!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* Preload VRM asset to shorten first render time */}
        <link
          rel="preload"
          href="/models/maki.vrm"
          as="fetch"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col relative">
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
