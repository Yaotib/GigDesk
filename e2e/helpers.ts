import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Local Supabase mail catcher (Mailpit). */
const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailSummary = { ID: string; To: { Address: string }[]; Created: string };

async function latestMailFor(email: string, after: number): Promise<MailSummary | undefined> {
  const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
  if (!res.ok) throw new Error(`Mailpit search failed: ${res.status}`);
  const body = (await res.json()) as { messages: MailSummary[] };
  return body.messages.find((m) => new Date(m.Created).getTime() >= after);
}

export async function waitForMagicLink(email: string, after: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const mail = await latestMailFor(email, after);
    if (mail) {
      const res = await fetch(`${MAILPIT}/api/v1/message/${mail.ID}`);
      const msg = (await res.json()) as { HTML: string };
      const match = msg.HTML.match(/href="([^"]*\/auth\/confirm\?[^"]+)"/);
      if (!match?.[1]) throw new Error("No sign-in link in the email.");
      return match[1].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No sign-in email for ${email}.`);
}

export async function hasEmailFor(email: string, after: number): Promise<boolean> {
  return (await latestMailFor(email, after)) !== undefined;
}

export async function signIn(page: Page, email: string) {
  const started = Date.now() - 1000;
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("status")).toContainText("sign-in link is on its way");
  const link = await waitForMagicLink(email, started);
  await page.goto(link);
  await expect(page).toHaveURL(/\/$/);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page scrolls horizontally").toBeLessThanOrEqual(0);
}

export async function expectNoSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}
