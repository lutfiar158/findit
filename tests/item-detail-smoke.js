// playwright-cli run-code --filename=tests/item-detail-smoke.js expects a function expression.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const origin = new URL(page.url()).origin;
  const checks = [];
  const errors = [];
  const runtimeErrors = [];
  const check = (ok, name) => {
    if (!ok) throw new Error(name);
    checks.push(name);
  };
  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
    if (/Suspense|instant-shell-url-data|URL data|runtime data/i.test(error.message)) errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /Suspense|instant-shell-url-data|URL data|runtime data/i.test(message.text())) {
      errors.push(message.text());
    }
  });

  const response = await page.request.get(`${origin}/barang/__detail_boundary_regression__`);
  const initialShell = (await response.text()).split("</main>")[0];
  check(/<header[\s>]/.test(initialShell) && /role="status"/.test(initialShell), "Route streams its shell and loading status before resolving unknown params");

  for (const [id, title, status] of [
    ["dompet-hitam", "Dompet Hitam Kulit", "HILANG"],
    ["kunci-honda", "Kunci Motor Honda", "DITEMUKAN"],
  ]) {
    await page.goto(`${origin}/barang/${id}`);
    await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    check((await page.title()) === `${title} | FindIt`, `${id}: metadata preserved`);
    check(await page.locator("main").getByText(status, { exact: true }).isVisible(), `${id}: status preserved`);
    check(await page.getByRole("navigation", { name: "Jalur Navigasi" }).isVisible(), `${id}: breadcrumbs preserved`);
    check(await page.getByRole("heading", { name: "Panduan Serah Terima Aman" }).isVisible(), `${id}: safety UI preserved`);
    check(await page.getByRole("heading", { name: "Rekomendasi Barang Cocok (Smart Matching)" }).isVisible(), `${id}: recommendations preserved`);
    await page.locator("summary").click();
    check(await page.getByText("Fitur kontak belum aktif pada demo ini.", { exact: false }).isVisible(), `${id}: contact disclosure preserved`);
    check(errors.length === 0, `${id}: no params/Suspense errors\n${errors.join("\n")}`);
  }

  await page.locator("main").getByRole("link", { name: "Dompet Hitam Kulit", exact: true }).click();
  await page.waitForURL("**/barang/dompet-hitam");
  await page.getByRole("heading", { level: 1, name: "Dompet Hitam Kulit" }).waitFor();
  await page.waitForLoadState("networkidle");
  check(errors.length === 0, `Client navigation: no params/Suspense errors\n${errors.join("\n")}`);

  await page.goto(`${origin}/barang/tidak-ada`);
  await page.getByRole("heading", { name: "Halaman atau barang tidak ditemukan" }).waitFor();
  await page.waitForLoadState("networkidle");
  check(await page.locator('meta[name="robots"][content="noindex"]').count() > 0, "Unknown ID: notFound and noindex preserved");
  check(await page.getByRole("heading", { level: 1, name: "Dompet Hitam Kulit" }).count() === 0, "Unknown ID: never falls back to another item");
  check(errors.length === 0, `Unknown ID: no params/Suspense errors\n${errors.join("\n")}`);
  return { passed: checks.length, checks, runtimeErrors };
}
