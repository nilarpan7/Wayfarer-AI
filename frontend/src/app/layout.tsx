import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Wayfarer AI — Autonomous Multi-Agent Travel Planner",
  description:
    "4 coordinated AI agents plan, optimize, and book your perfect trip in real-time. Real prices, zero mock data, 1-click booking.",
  keywords: [
    "AI travel planner",
    "multi-agent",
    "autonomous travel",
    "flight booking",
    "hotel search",
    "itinerary generator",
  ],
  openGraph: {
    title: "Wayfarer AI — Autonomous Multi-Agent Travel Planner",
    description:
      "4 coordinated AI agents plan, optimize, and book your perfect trip in real-time.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cleanAttrs = function() {
                    var elms = document.querySelectorAll('[bis_skin_checked], [bis_register], [fdprocessedid]');
                    for (var i = 0; i < elms.length; i++) {
                      elms[i].removeAttribute('bis_skin_checked');
                      elms[i].removeAttribute('bis_register');
                      elms[i].removeAttribute('fdprocessedid');
                    }
                  };
                  cleanAttrs();
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanAttrs);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {process.env.NEXT_PUBLIC_TYPEKIT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_TYPEKIT_ID}.css`}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <div aria-hidden className="grain-overlay" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
