import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "文渊寻脉",
  description: "山是书山，河是航线：罗盘领四库、海图通万国书，走进诸子世界与先贤对谈、观百家争鸣。",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
