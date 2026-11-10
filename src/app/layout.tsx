import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from "@/components/ui/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 하위 페이지의 title이 "공연 목록 | 티켓팅 연습" 형태로 붙는다
  title: { default: "티켓팅 연습", template: "%s | 티켓팅 연습" },
  description: "실전처럼 연습하는 티켓팅 시뮬레이터",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
