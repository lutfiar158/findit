// playwright-cli run-code --filename=tests/navigation-smoke.js expects a function expression.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const origin = new URL(page.url()).origin;
  const checks = [];
  const check = (ok, name) => {
    if (!ok) throw new Error(name);
    checks.push(name);
  };
  const activeLinks = () => page.locator('nav[aria-label="Navigasi utama"]:visible a[aria-current]');
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route, expected] of [
      ["/", "/"],
      ["/jelajahi-barang", "/jelajahi-barang"],
      ["/barang/dompet-hitam", "/jelajahi-barang"],
      ["/barang/kunci-honda", "/jelajahi-barang"],
      ["/login", null],
      ["/register", null],
    ]) {
      await page.goto(`${origin}${route}`);
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.waitForLoadState("networkidle");
      const hrefs = await activeLinks().evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      check(JSON.stringify(hrefs) === JSON.stringify(expected ? [expected] : []), `${width}px ${route}: expected active menu ${expected ?? "none"}, got ${JSON.stringify(hrefs)}`);
      if (expected) {
        check(await activeLinks().evaluate((link) => getComputedStyle(link).backgroundColor) === "rgb(55, 88, 249)", `${width}px ${route}: active color is #3758F9`);
      }
    }
  }

  await page.goto(`${origin}/`);
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Jelajahi Barang" }).click();
  await page.waitForURL("**/jelajahi-barang");
  await page.getByRole("link", { name: "Lihat detail Dompet Hitam Kulit", exact: true }).click();
  await page.waitForURL("**/barang/dompet-hitam");
  check(await activeLinks().getAttribute("href") === "/jelajahi-barang", "Client navigation keeps Jelajahi Barang active on detail");
  return { passed: checks.length, checks };
}
