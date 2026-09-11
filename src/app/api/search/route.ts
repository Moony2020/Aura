import { NextResponse } from "next/server";

import { SEARCH_QUICK_LIMIT, searchPublishedFragrances } from "@/server/queries/search-published-fragrances";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const result = await searchPublishedFragrances(query, { limit: SEARCH_QUICK_LIMIT });

  return NextResponse.json(result, { status: result.error?.status ?? 200 });
}

