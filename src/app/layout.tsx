import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA — Luxury Fragrance | Haute Parfumerie",
  description: "Enter the world of AURA Haute Parfumerie. Discover timeless luxury fragrances that leave an unforgettable impression.",
  keywords: ["AURA", "Luxury Fragrance", "Haute Parfumerie", "Perfume", "Dior J'adore", "Niche Scents"],
  openGraph: {
    title: "AURA — Luxury Fragrance",
    description: "Enter the world of AURA Haute Parfumerie.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Montserrat:wght@200;300;400;500;600&family=Cinzel:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#080809] text-[#FDF2EC] antialiased overflow-x-hidden min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
