import type { Metadata, Viewport } from "next";
import { Black_Han_Sans, Gowun_Dodum } from "next/font/google";
import "./globals.css";

const display = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "siljuyu | 총비용 주유소 랭킹",
  description: "주유 가격과 편도 이동 연료비를 합쳐 진짜 싼 주유소를 찾습니다.",
  applicationName: "siljuyu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07140f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
