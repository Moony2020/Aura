import { siteConfig } from "@/config/site";
import { StorefrontContainer } from "./StorefrontContainer";

export function StorefrontFooterShell() {
  return (
    <footer className="storefront-footer">
      <StorefrontContainer className="storefront-footer__inner">
        <div>
          <p className="storefront-footer__eyebrow">{siteConfig.category}</p>
          <p className="storefront-footer__brand">{siteConfig.name}</p>
        </div>
        <p className="storefront-footer__note">The Maison storefront is being prepared.</p>
      </StorefrontContainer>
    </footer>
  );
}
