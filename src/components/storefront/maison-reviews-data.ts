export type MaisonReview = {
  id: string;
  initials: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  verified: boolean;
  fragrance: string;
  fragranceSlug: string;
  volumeOrType: string;
  title: string;
  body: string;
  note: string;
  category: "product" | "company";
  helpfulCount?: number;
};

export const maisonReviews: MaisonReview[] = [
  {
    id: "rose-evening",
    initials: "LM",
    author: "Leila M.",
    location: "Stockholm",
    rating: 5,
    date: "2 days ago",
    verified: true,
    fragrance: "Élixir de Rose",
    fragranceSlug: "elixir-de-rose",
    volumeOrType: "EdP 100ml",
    title: "A rose with real presence.",
    body: "The opening feels luminous rather than sweet, then settles into a warm, quietly elegant trail for the evening. Compliments every single time I wear it.",
    note: "Rose · amber · soft musk",
    category: "product",
    helpfulCount: 24,
  },
  {
    id: "amber-signature",
    initials: "AR",
    author: "Amir R.",
    location: "Gothenburg",
    rating: 5,
    date: "4 days ago",
    verified: true,
    fragrance: "Ambre Féminin",
    fragranceSlug: "ambre-feminin",
    volumeOrType: "EdP 100ml",
    title: "Rich, composed, and beautifully balanced.",
    body: "It has the depth I look for in amber, yet the finish stays polished and easy to wear through the day. The craftsmanship is undeniable.",
    note: "Amber · resin · vanilla",
    category: "product",
    helpfulCount: 19,
  },
  {
    id: "nocturne-gift",
    initials: "SK",
    author: "Sofia K.",
    location: "Malmö",
    rating: 5,
    date: "5 days ago",
    verified: true,
    fragrance: "Jasmine Nocturne",
    fragranceSlug: "jasmine-nocturne",
    volumeOrType: "EdP 100ml",
    title: "A thoughtful gift that felt personal.",
    body: "The composition is floral without becoming predictable. It arrived like a small ritual, wrapped with care in gold foil and luxury embossing.",
    note: "Jasmine · sandalwood · skin musk",
    category: "product",
    helpfulCount: 31,
  },
  {
    id: "oud-ritual",
    initials: "DN",
    author: "Daniel N.",
    location: "Uppsala",
    rating: 5,
    date: "1 week ago",
    verified: true,
    fragrance: "Oud Lumière",
    fragranceSlug: "oud-lumiere",
    volumeOrType: "Extrait 100ml",
    title: "Warm woods, lifted by a clean finish.",
    body: "I enjoy how the woods stay clear and refined instead of heavy. It has become an essential part of my evening routine.",
    note: "Oud · cedar · saffron",
    category: "product",
    helpfulCount: 15,
  },
  {
    id: "lune-memory",
    initials: "EC",
    author: "Elena C.",
    location: "Lund",
    rating: 5,
    date: "1 week ago",
    verified: true,
    fragrance: "Fleur de Lune",
    fragranceSlug: "fleur-de-lune",
    volumeOrType: "EdP 100ml",
    title: "Softly memorable from first spray to drydown.",
    body: "There is a calm, velvety quality to it that makes every wear feel considered rather than loud. Exceptional longevity of 12+ hours.",
    note: "White flowers · iris · powder",
    category: "product",
    helpfulCount: 28,
  },
  {
    id: "velvet-service",
    initials: "MA",
    author: "Marcus A.",
    location: "Stockholm",
    rating: 5,
    date: "2 weeks ago",
    verified: true,
    fragrance: "AURA Concierge & Packaging",
    fragranceSlug: "",
    volumeOrType: "Delivery & Service",
    title: "Flawless unboxing experience and lightning fast delivery.",
    body: "Ordered on Tuesday morning and had the package delivered in Stockholm the next afternoon. The gold-embossed box and complimentary discovery samples were extraordinary.",
    note: "Verified Client Experience",
    category: "company",
    helpfulCount: 42,
  },
];
