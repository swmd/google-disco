import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenTabs — Prompt-driven Generative UI",
  description:
    "A prototype that turns text prompts into dynamically composed, animated interfaces. Inspired by the Google Disco / GenTabs concept.",
};

export const viewport: Viewport = {
  themeColor: "#0c0f16",
  width: "device-width",
  initialScale: 1,
};

/**
 * Inline theme bootstrap: sets .dark before paint to avoid a flash of the wrong
 * theme. Kept tiny and dependency-free.
 */
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#workspace"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
