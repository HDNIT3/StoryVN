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

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://storyvn.eastasia.cloudapp.azure.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StoryVN — Web Đọc Truyện Online",
    template: "%s | StoryVN",
  },
  description: "Nền tảng đọc truyện chữ, truyện dịch online mới nhất và hấp dẫn nhất",
  openGraph: {
    title: "StoryVN — Web Đọc Truyện Online",
    description: "Nền tảng đọc truyện chữ, truyện dịch online mới nhất và hấp dẫn nhất",
    url: siteUrl,
    siteName: "StoryVN",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/icon/iconweb.png",
        width: 512,
        height: 512,
        alt: "StoryVN Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StoryVN — Web Đọc Truyện Online",
    description: "Nền tảng đọc truyện chữ, truyện dịch online mới nhất và hấp dẫn nhất",
    images: ["/icon/iconweb.png"],
  },
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

