import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Cinzel } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — Luxury Fragrance | ${siteConfig.category}`,
  description: siteConfig.description,
  keywords: ["AURA", "Luxury Fragrance", "Haute Parfumerie", "Perfume", "Dior J'adore", "Niche Scents"],
  openGraph: {
    title: `${siteConfig.name} — Luxury Fragrance`,
    description: siteConfig.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${cormorant.variable} ${montserrat.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${montserrat.className} bg-[#080809] text-[#FDF2EC] antialiased overflow-x-hidden min-h-screen min-w-[360px]`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

