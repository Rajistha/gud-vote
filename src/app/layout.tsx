import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "GUD Vote · Regenerasi Girl Up Diponegoro",
  description: "Rooted In Care, Equality Everywhere. E-voting Regenerasi Girl Up Diponegoro.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffd3e5" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${bricolage.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
