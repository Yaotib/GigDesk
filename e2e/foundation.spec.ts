import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectNoSeriousA11yIssues, hasEmailFor, signIn } from "./helpers";

// Seeded by supabase/seed.sql and listed in ALLOWED_EMAILS for local runs.
const MEMBER = "member@example.com";

test.describe("auth", () => {
  test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/enquiries");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousA11yIssues(page);
  });

  test("an email that is not on the team list gets no link", async ({ page }) => {
    const outsider = `outsider-${Date.now()}@example.org`;
    const started = Date.now() - 1000;
    await page.goto("/login");
    await page.getByLabel("Work email").fill(outsider);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    // Same message as for a team member, so the page does not reveal who is on the list.
    await expect(page.getByRole("status")).toContainText("sign-in link is on its way");
    await page.waitForTimeout(1500);
    expect(await hasEmailFor(outsider, started)).toBe(false);
  });

  test("an invalid link shows a clear error", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=nonsense&type=email");
    await expect(page).toHaveURL(/\/login\?error=link-invalid$/);
    await expect(page.getByText("That sign-in link has expired or was already used")).toBeVisible();
  });
});

test.describe("app shell", () => {
  test("a team member signs in with a magic link and can move around", async ({ page }, testInfo) => {
    await signIn(page, MEMBER);
    const mobile = testInfo.project.name.startsWith("mobile");

    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousA11yIssues(page);

    if (mobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const menu = page.getByRole("dialog");
      await menu.getByRole("link", { name: "Enquiries" }).click();
      await expect(menu).toBeHidden();
    } else {
      await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Enquiries" }).click();
    }

    await expect(page).toHaveURL(/\/enquiries$/);
    await expect(page.getByRole("heading", { name: "Enquiries", level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    for (const path of ["/events", "/quotes", "/riders", "/settings"]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousA11yIssues(page);
    }

    // Sign out (in the menu sheet on mobile, in the sidebar on desktop).
    if (mobile) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
