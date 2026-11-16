// playwright-cli run-code --filename=tests/browser-smoke.js expects a function expression.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async (page) => {
  const checks = [];
  const check = (ok, name) => {
    if (!ok) throw new Error(name);
    checks.push(name);
  };
  const errors = [];
  const input = (name) => page.locator(`main:visible input[name="${name}"]`);
  const noScript = await page.context().browser().newContext({ javaScriptEnabled: false });
  try {
    const noScriptPage = await noScript.newPage();
    for (const route of ["/login", "/register"]) {
      await noScriptPage.goto("http://localhost:3000" + route);
      check(await noScriptPage.getByRole("button", { name: route === "/login" ? "Masuk" : "Buat Akun", exact: true }).isDisabled(), `${route} cannot submit without JavaScript`);
      check(await noScriptPage.locator("input[name=password]").isDisabled(), `${route} cannot accept credentials before hydration`);
    }
  } finally {
    await noScript.close();
  }
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => document.fonts.ready);
  check(await page.locator("article").count() === 6, "Home shows six mock reports");
  await page.getByRole("button", { name: "Hilang", exact: true }).click();
  check(await page.locator("article").count() === 3, "Home lost filter works");
  await page.getByRole("button", { name: "Ditemukan", exact: true }).click();
  check(await page.locator("article").count() === 3, "Home found filter works");
  await page.getByRole("textbox", { name: "Cari barang", exact: true }).fill("  DOMPET  ");
  await page.getByRole("combobox", { name: "Lokasi Kampus", exact: true }).selectOption("perpus");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await page.waitForURL("**/jelajahi-barang?**");
  await page.getByRole("button", { name: "Reset Filter" }).waitFor();
  check(await page.locator("article").count() === 2, "Hero search and location reach catalog");
  await page.getByRole("button", { name: /^Ditemukan/ }).click();
  await page.getByText("Barang belum ditemukan di katalog", { exact: true }).waitFor();
  check(await page.locator("article").count() === 0, "Combined filters show empty state");
  await page.getByRole("button", { name: "Reset Filter" }).first().click();
  check(await page.locator("article").count() === 9, "Reset restores nine mock reports");
  await page.getByRole("combobox", { name: "Kategori", exact: true }).selectOption("Elektronik");
  check(await page.locator("article").count() === 3, "Category filter works");
  await page.getByRole("combobox", { name: "Area Lokasi", exact: true }).selectOption("lab");
  check(await page.locator("article").count() === 2, "Category and area combine");
  await page.getByRole("link", { name: "Lihat detail Earbuds TWS Putih", exact: true }).click();
  await page.waitForURL("**/barang/earbuds");
  await page.getByRole("heading", { name: "Earbuds TWS Putih", level: 1 }).waitFor();
  check(page.url().endsWith("/barang/earbuds"), "Card opens corresponding detail");
  await page.locator("summary").click();
  check(await page.getByText("Fitur kontak belum aktif pada demo ini.", { exact: false }).isVisible(), "Contact demo does not pretend to send");
  await page.screenshot({ path: "/tmp/opencode/findit-detail-desktop.png", fullPage: true });
  await page.goto("http://localhost:3000/barang/tidak-ada");
  check(await page.getByRole("heading", { name: "Halaman atau barang tidak ditemukan" }).isVisible(), "Unknown item shows not-found UI");
  check(await page.locator("meta[name=robots][content=noindex]").count() > 0, "Unknown item is noindex");
  await page.goto("http://localhost:3000/login");
  let authRequests = 0;
  const onRequest = (request) => { if (request.method() === "POST") authRequests++; };
  page.on("request", onRequest);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  check(await page.locator("main").getByRole("alert").isVisible(), "Empty login validation works");
  await input("email").fill("demo@kampus.ac.id");
  await input("password").fill("Demo1234");
  await page.getByRole("button", { name: "Tampilkan password", exact: true }).click();
  check(await input("password").getAttribute("type") === "text", "Password visibility toggle works");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  check((await page.getByRole("status").textContent()).includes("Belum terhubung Supabase"), "Valid login clearly remains demo");
  await page.getByRole("link", { name: "Daftar sekarang" }).click();
  await page.waitForURL("**/register");
  await page.getByRole("heading", { name: "Yuk, gabung FindIt!" }).waitFor();
  check(await page.evaluate(() => {
    const ids = [...document.querySelectorAll("form input[id]")].map((element) => element.id);
    return ids.length === new Set(ids).size;
  }), "Auth input IDs remain unique across retained routes");
  await input("name").fill("Mahasiswa Demo");
  await input("email").fill("demo@kampus.ac.id");
  await input("password").fill("Demo1234");
  await input("confirmation").fill("Demo5678");
  await page.getByRole("button", { name: "Buat Akun", exact: true }).click();
  check((await page.locator("main").getByRole("alert").textContent()).includes("tidak cocok"), "Registration detects mismatched confirmation");
  await input("confirmation").fill("Demo1234");
  await page.getByRole("button", { name: "Buat Akun", exact: true }).click();
  check((await page.getByRole("status").textContent()).includes("Belum terhubung Supabase"), "Valid registration does not fake account creation");
  check(authRequests === 0, "Authentication submits no credentials over network");
  check(!page.url().includes("Demo1234"), "Password never enters URL");
  await page.screenshot({ path: "/tmp/opencode/findit-register-desktop.png", fullPage: true });
  page.off("request", onRequest);
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    await page.emulateMedia({ colorScheme: "dark" });
    for (const route of ["/", "/jelajahi-barang", "/barang/dompet-hitam", "/login", "/register"]) {
      await page.goto("http://localhost:3000" + route);
      await page.getByRole("heading", { level: 1 }).waitFor();
      if (route === "/jelajahi-barang") {
        await page.getByRole("textbox", { name: "Cari barang", exact: true }).waitFor();
        check(await page.locator("article").count() === 9, `Catalog content is ready at ${width}px`);
      }
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        scheme: getComputedStyle(document.documentElement).colorScheme,
      }));
      check(!layout.overflow, `${route} has no horizontal overflow at ${width}px`);
      check(layout.scheme === "light", `${route} remains light with dark OS at ${width}px`);
      if (width === 375) await page.screenshot({ path: "/tmp/opencode/findit-" + (route === "/" ? "home" : route.split("/").pop()) + "-mobile.png", fullPage: true });
    }
  }
  await page.goto("http://localhost:3000/");
  await page.keyboard.press("Tab");
  check(await page.evaluate(() => document.activeElement?.textContent === "Lewati ke konten"), "Keyboard skip link is first focus target");
  await page.keyboard.press("Enter");
  check(await page.evaluate(() => document.activeElement?.id === "main-content"), "Skip link moves focus to main");
  check(errors.length === 0, "No browser runtime errors");
  return { passed: checks.length, checks };
}
