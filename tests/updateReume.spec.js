const { test, expect } = require('@playwright/test');

test('Update Resume on Naukri', async ({ page }) => {
  await page.goto('https://www.naukri.com/');
  await page.click('text=Login');
  await page.fill('input[placeholder="Enter your active Email ID / Username"]', process.env.NAUKRI_EMAIL);
  await page.fill('input[placeholder="Enter your password"]', process.env.NAUKRI_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('https://www.naukri.com/mnjuser/homepage');
  await page.goto('https://www.naukri.com/mnjuser/profile');
  await page.click('text=Update Resume');
  await page.setInputFiles('input[type="file"]', process.env.NAUKRI_RESUME_PATH);
  await page.waitForTimeout(3000);
  expect(page.locator('text=Resume has been successfully uploaded')).toBeVisible();
});

