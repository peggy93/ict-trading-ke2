import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "ICT / SMC Trading Dashboard",
  description:
    "Institutional Smart Money Concepts analysis & trading dashboard for BingX (Spot + USDT-M Perp)",
  icons: { icon: "/favicon.svg" },
};

/**
 * Applies the persisted theme + accent before first paint to avoid a
 * flash-of-incorrect-theme. Runs synchronously in <head>.
 */
const themeBootstrap = `
(function(){try{
  var t = localStorage.getItem('ict-theme') || 'dark';
  var a = localStorage.getItem('ict-accent') || '#6366f1';
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.setProperty('--accent', a);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
