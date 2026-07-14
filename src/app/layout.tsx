import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "ICT / SMC Scanner",
  description: "Institutional Smart Money Concepts analysis platform for BingX (Spot + USDT-M Perp)",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
