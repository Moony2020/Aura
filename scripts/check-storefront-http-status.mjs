const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const routes = [
  ["/", 200],
  ["/product/elixir-de-rose", 200],
  ["/product/noir-cashmere", 404],
  ["/product/not-a-real-product", 404],
  ["/collections/cinematic-worlds", 404],
  ["/cart", 200],
  ["/wishlist", 404],
];

if (process.env.PUBLIC_COLLECTION_SLUG) {
  routes.splice(2, 0, [`/collections/${process.env.PUBLIC_COLLECTION_SLUG}`, 200]);
}

const results = [];
for (const [path, expectedStatus] of routes) {
  try {
    const response = await fetch(new URL(path, baseUrl), { redirect: "follow" });
    const body = await response.text();
    const actualStatus = response.status;
    results.push({
      path,
      expectedStatus,
      actualStatus,
      finalUrl: response.url,
      contentLength: body.length,
      pass: actualStatus === expectedStatus,
    });
  } catch (error) {
    results.push({
      path,
      expectedStatus,
      actualStatus: "REQUEST_ERROR",
      finalUrl: "",
      contentLength: 0,
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const result of results) {
  console.log(
    `${result.pass ? "PASS" : "FAIL"} ${result.path} expected=${result.expectedStatus} actual=${result.actualStatus} final=${result.finalUrl || "-"} contentLength=${result.contentLength}${result.error ? ` error=${result.error}` : ""}`,
  );
}

if (results.every((result) => result.pass)) {
  console.log("STOREFRONT_HTTP_STATUS_CHECK: PASS");
} else {
  console.error("STOREFRONT_HTTP_STATUS_CHECK: FAIL");
  process.exitCode = 1;
}
