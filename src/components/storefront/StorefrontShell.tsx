import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import { StorefrontHeaderShell } from "./StorefrontHeaderShell";

export function StorefrontShell({ children }: { children: ReactNode }) {
  return (
    <div className="storefront-shell">
      <a className="storefront-skip-link" href="#storefront-main">Skip to content</a>
      <StorefrontHeaderShell />
      <main id="storefront-main" className="storefront-main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
