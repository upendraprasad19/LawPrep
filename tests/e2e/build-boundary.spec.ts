import { expect, test } from '@playwright/test';

test('built public website opens the independently built learner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /find your way into law/i })).toBeVisible();
  await page.getByRole('link', { name: 'Explore your study path' }).click();
  await expect(page.getByRole('heading', { name: 'Your preparation starts here' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Study navigation' })).toBeVisible();
});
test('static learner assets work without a Next.js rendering runtime', async ({ page }) => {
  await page.goto('http://127.0.0.1:43174/');
  await expect(page.getByRole('heading', { name: 'Your preparation starts here' })).toBeVisible();
  expect(await page.locator('body').innerText()).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
});

test('entry redirect is bounded and route selection works on a phone', async ({ page, request }) => {
  const entry = await request.get('/study', { maxRedirects: 0 });
  expect(entry.status()).toBe(307);
  expect(entry.headers().location).toBe('/study/');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/study/#/');
  await page.getByRole('link', { name: 'Explore exam routes' }).click();
  await page.getByRole('radio', { name: /BLET/ }).check();
  await expect(page.getByRole('heading', { name: 'BLET · Patna', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('keyboard skip link focuses content without changing the study route', async ({ page }) => {
  await page.goto('/study/#/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/study\/#\/$/);
  await expect(page.locator('main')).toBeFocused();
});
