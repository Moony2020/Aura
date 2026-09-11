import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StorefrontContainer } from "@/components/storefront/StorefrontContainer";

export const metadata: Metadata = {
  title: "About AURA | Maison",
  description: "Discover the story, mission, craftsmanship, ingredients, and legacy behind AURA Haute Parfumerie.",
};

const values = [
  {
    title: "Timeless elegance",
    copy: "Designed to transcend trends and time.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="3" width="4" height="3" rx="0.5" />
        <path d="M12 6v2" />
        <rect x="6" y="8" width="12" height="13" rx="2.5" />
        <circle cx="12" cy="14.5" r="3" />
        <path d="M12 13c-.8 1.1-1.2 1.7-1.2 2.5a1.2 1.2 0 1 0 2.4 0c0-.8-.4-1.4-1.2-2.5z" />
      </svg>
    )
  },
  {
    title: "Inspired by emotions",
    copy: "Every scent is a reflection of a feeling.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 9.5l1.5 1.5-1.5 1.5-1.5-1.5Z" />
      </svg>
    )
  },
  {
    title: "Crafted with integrity",
    copy: "Meticulous craftsmanship in every drop.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3h4M12 3v5" />
        <path d="M8.5 8h7L20 18a2 2 0 0 1-1.7 3H5.7A2 2 0 0 1 4 18L8.5 8Z" />
        <path d="M12 13.5c-.8 1.1-1.2 1.7-1.2 2.5a1.2 1.2 0 1 0 2.4 0c0-.8-.4-1.4-1.2-2.5z" />
      </svg>
    )
  },
  {
    title: "Made to leave a lasting impression",
    copy: "An invisible signature remembered after the moment.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <path d="M12 12c-2-2-3.5-2.5-3.5-4.5S10 4 12 4s3.5 1.5 3.5 3.5S14 10 12 12Z" />
        <path d="M12 12c2-2 2.5-3.5 4.5-3.5S20 10 20 12s-1.5 3.5-3.5 3.5S14 14 12 12Z" />
        <path d="M12 12c2 2 3.5 2.5 3.5 4.5S14 20 12 20s-3.5-1.5-3.5-3.5S10 14 12 12Z" />
        <path d="M12 12c-2 2-2.5 3.5-4.5 3.5S4 14 4 12s1.5-3.5 3.5-3.5S10 10 12 12Z" />
      </svg>
    )
  }
];

const ingredients = [
  {
    name: "Rose",
    origin: "Bulgarian",
    image: "/assets/ingredient-rose.webp",
  },
  {
    name: "Oud",
    origin: "Cambodian",
    image: "/assets/ingredient-oud.webp",
  },
  {
    name: "Sandalwood",
    origin: "Australian",
    image: "/assets/ingredient-sandalwood.webp",
  },
  {
    name: "Jasmine",
    origin: "Sambac",
    image: "/assets/ingredient-jasmine.webp",
  },
  {
    name: "Vanilla",
    origin: "Madagascar",
    image: "/assets/ingredient-vanilla.webp",
  },
  {
    name: "Amber",
    origin: "Resin",
    image: "/assets/ingredient-amber.webp",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="about-page about-page--refined" aria-labelledby="about-title">
      <section className="about-maison-hero">
        <Image
          src="/assets/about-aura-hero.png"
          alt="AURA woman applying perfume in candlelight"
          fill
          priority
          sizes="100vw"
          className="about-maison-hero__image"
        />
        <div className="about-maison-hero__veil" aria-hidden="true" />
        <StorefrontContainer className="about-maison-hero__content">
          <p className="fragrance-catalog-eyebrow">The Maison</p>
          <h1 id="about-title">The Art of <em>Emotion</em></h1>
          <div className="about-maison-rule" aria-hidden="true" />
          <p>
            AURA is a luxury fragrance house built on the belief that scent is more than a fragrance.
            It is a memory, a feeling, a part of who you are. We create invisible signatures that
            leave a lasting impression.
          </p>
          <Link href="#our-story" className="about-page__link">Discover our story <span aria-hidden="true">→</span></Link>
        </StorefrontContainer>
      </section>

      <section className="about-maison-story" id="our-story" aria-labelledby="about-story-title">
        <StorefrontContainer className="about-maison-story__layout">
          <div className="about-maison-story__copy">
            <p className="fragrance-catalog-eyebrow">Our Story</p>
            <h2 id="about-story-title">A passion for scent. <br />A vision for <em>individuality.</em></h2>
            <p>
              Founded in 2026, AURA was born from a desire to create fragrances that go beyond olfactory
              pleasure. We believe that scent is a powerful medium for storytelling, a way to connect
              with our emotions, and a means to express our unique identity.
            </p>
            <p>
              Every fragrance in our collection is meticulously crafted in our atelier, using only the
              finest and most precious raw materials sourced from around the globe.
            </p>
          </div>
          <figure className="about-maison-story__media">
            <Image src="/assets/about-aura-story.png" alt="AURA perfume bottles in low light" fill sizes="(max-width: 900px) 100vw, 42vw" />
          </figure>
        </StorefrontContainer>
      </section>

      <section className="about-maison-values" aria-label="AURA values">
        <StorefrontContainer className="about-maison-values__grid">
          {values.map((value, index) => (
            <article key={value.title} className="about-maison-values__item">
              <span className="about-maison-values__icon-badge" aria-hidden="true">{value.icon}</span>
              <h3>{value.title}</h3>
              <p>{value.copy}</p>

              {index < values.length - 1 && (
                <div className="about-maison-values__separator" aria-hidden="true">
                  <span className="about-maison-values__separator-line" />
                  <span className="about-maison-values__separator-star">✦</span>
                  <span className="about-maison-values__separator-line" />
                </div>
              )}
            </article>
          ))}
        </StorefrontContainer>
      </section>

      <section className="about-maison-beliefs" aria-label="AURA mission and vision">
        <StorefrontContainer className="about-maison-beliefs__content">
          <article className="about-maison-beliefs__card">
            <p className="fragrance-catalog-eyebrow">Our mission</p>
            <h2>To create exceptional fragrances that celebrate individuality and <em>elevate every moment.</em></h2>
          </article>
          <div className="about-maison-beliefs__divider" aria-hidden="true">
            <span className="about-maison-beliefs__divider-line" />
            <span className="about-maison-beliefs__divider-star">✦</span>
            <span className="about-maison-beliefs__divider-line" />
          </div>
          <article className="about-maison-beliefs__card">
            <p className="fragrance-catalog-eyebrow">Our vision</p>
            <h2>To be a global house of niche perfumery, recognized for <em>artistry, authenticity, and</em> unforgettable olfactory experiences.</h2>
          </article>
        </StorefrontContainer>
      </section>

      <section className="about-maison-craft" aria-labelledby="about-craft-title">
        <StorefrontContainer className="about-maison-craft__layout">
          <div className="about-maison-craft__copy">
            <p className="fragrance-catalog-eyebrow">Craftsmanship</p>
            <h2 id="about-craft-title">The finest ingredients. The <em>highest</em> standards.</h2>
            <p>
              Each fragrance is a result of meticulous artistry. From concept to creation, our master
              perfumers carefully balance the world&apos;s finest ingredients to craft harmonious and
              long-lasting compositions.
            </p>
            <Link href="/fragrances" className="about-page__button">
              DISCOVER OUR PROCESS <span aria-hidden="true">›</span>
            </Link>
          </div>
          <figure className="about-maison-craft__media">
            <Image
              src="/assets/about-aura-process.png"
              alt="Master perfumer smelling a scent strip in the AURA atelier"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </figure>
        </StorefrontContainer>
      </section>

      <section className="about-maison-nature" aria-labelledby="about-nature-title">
        <StorefrontContainer className="about-maison-nature__container">
          <p className="about-maison-nature__eyebrow" id="about-nature-title">NATURE&apos;S RAREST, PERFECTED</p>
          <div className="about-maison-nature__grid">
            {ingredients.map((ingredient, index) => (
              <article key={ingredient.name} className="about-maison-nature__item">
                <Image
                  src={ingredient.image}
                  alt={ingredient.name}
                  width={140}
                  height={140}
                  className="about-maison-nature__img"
                />
                <h3 className="about-maison-nature__title">{ingredient.name}</h3>
                <p className="about-maison-nature__origin">{ingredient.origin}</p>

                {index < ingredients.length - 1 && (
                  <div className="about-maison-nature__separator" aria-hidden="true">
                    <span className="about-maison-nature__separator-line" />
                    <span className="about-maison-nature__separator-star">✦</span>
                    <span className="about-maison-nature__separator-line" />
                  </div>
                )}
              </article>
            ))}
          </div>
        </StorefrontContainer>
      </section>

      <section className="about-maison-signature" aria-labelledby="about-signature-title">
        <Image
          src="/assets/about-aura-signature.png"
          alt="AURA perfume bottle and burning candle"
          fill
          sizes="100vw"
        />
        <div className="about-maison-signature__veil" aria-hidden="true" />
        <StorefrontContainer className="about-maison-signature__content">
          <p className="fragrance-catalog-eyebrow">A SIGNATURE. A LEGACY.</p>
          <h2 id="about-signature-title">
            More than a scent. <br />
            It&apos;s <em>your</em> story.
          </h2>
          <p>
            AURA is an invitation to express who you are, to embrace every moment, and to be
            remembered. Because true luxury is not seen, it is felt.
          </p>
        </StorefrontContainer>
      </section>
    </main>
  );
}
