import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: "#0A0A0B",
          dark: "#0D0D0E",
          card: "#121215",
          gold: {
            light: "#F5E4B5",
            DEFAULT: "#D4AF37",
            champagne: "#E5C158",
            deep: "#9E7B1A",
          },
          rose: {
            light: "#FDF2EC",
            DEFAULT: "#F3D8C7",
            dark: "#D8A48F",
          },
          charcoal: {
            800: "#1C1C20",
            900: "#111114",
            950: "#080809",
          }
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Cinzel", "Playfair Display", "Georgia", "serif"],
        sans: ["Montserrat", "Inter", "-apple-system", "sans-serif"],
        aura: ["Cinzel", "serif"],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F5E4B5 0%, #D4AF37 50%, #AA8010 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #D4AF37 0%, #FFF3D1 50%, #D4AF37 100%)',
        'dark-radial': 'radial-gradient(ellipse at center, rgba(20,20,24,0.4) 0%, rgba(10,10,11,0.9) 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
