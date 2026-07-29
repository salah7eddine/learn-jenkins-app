// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Learn Jenkins/);
});

test('has Jenkins in the body', async ({ page }) => {
  await page.goto('/');

  const isVisible = await page.locator('a:has-text("Learn Jenkins on Udemy")').isVisible();
  expect(isVisible).toBeTruthy();
});

/**
 * 
 * test('has expected app version', async ({ page }) => {
  await page.goto('/');
  const expectedAppVersion = process.env.REACT_APP_VERSION || '1';

  // Find the paragraph that contains the label and assert it includes the expected version
  const versionParagraph = page.locator('p', { hasText: 'Application version:' });
  await expect(versionParagraph).toContainText(expectedAppVersion);
});
 */
