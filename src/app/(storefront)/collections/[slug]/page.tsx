import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FragranceCard } from "@/components/storefront/FragranceCard";
import { getPublicCollection } from "@/server/queries/get-public-collection";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getPublicCollection((await params).slug);
  return result.collection ? { title: `${result.collection.name} | AURA`, description: result.collection.description } : { title: "Collections | AURA" };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getPublicCollection((await params).slug);
  if (!result.collection && !result.error) notFound();
  if (result.error) return <main className="collection-detail-page"><div className="fragrance-catalog-state" role="alert"><h1>Collection unavailable</h1><p>{result.error.message}</p></div></main>;
  const collection = result.collection!;
  return <main className="collection-detail-page" aria-labelledby="collection-detail-title">
    <section className="collection-detail-hero"><p className="fragrance-catalog-eyebrow">AURA / COLLECTION</p><h1 id="collection-detail-title">{collection.name}</h1><p>{collection.description}</p></section>
    <section className="collection-detail-products" aria-labelledby="collection-products-title"><div className="fragrance-catalog-section-heading"><p className="fragrance-catalog-eyebrow">The collection</p><h2 id="collection-products-title">Composed in order</h2></div>{collection.products.length ? <div className="fragrance-grid">{collection.products.map((product) => <FragranceCard key={product.slug} product={product} />)}</div> : <div className="fragrance-catalog-state"><h3>This collection is being composed.</h3><p>Published products will appear here when its membership is ready.</p></div>}</section>
  </main>;
}
