import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./providers";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoryVN — Web Đọc Truyện Online",
  description: "Nền tảng đọc truyện chữ, truyện dịch online mới nhất và hấp dẫn nhất",
  icons: {
    icon: "/icon/iconweb.png",
    shortcut: "/icon/iconweb.png",
    apple: "/icon/iconweb.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}

