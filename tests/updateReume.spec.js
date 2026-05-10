const { test, expect } = require('@playwright/test');

test('Update Resume on Naukri', async ({ page }) => {

  // 1. Open site (stable load strategy)
  await page.goto('https://www.naukri.com/', {
    waitUntil: 'domcontentloaded'
  });

  // 2. Click Login (more stable locator)
  await page.locator('#login_Layer').click();

  // 3. Fill credentials (with env vars)
  await page.locator('input[placeholder*="Email"]').fill(process.env.NAUKRI_EMAIL);
  await page.locator('input[placeholder*="password" i]').fill(process.env.NAUKRI_PASSWORD);

  // 4. Submit login
  await page.locator('button[type="submit"]').click();

  // 5. Wait for successful login (avoid exact URL match)
  await page.waitForURL(/homepage/, { timeout: 60000 });

  // 6. Go to profile
  await page.goto('https://www.naukri.com/mnjuser/profile');

  // 7. Click Update Resume (more stable text match)
  await page.getByText('Update Resume', { exact: false }).click();

  // 8. Upload file (fix: ensure correct env usage)
  await page.setInputFiles(
    'input[type="file"]',
    process.env.NAUKRI_RESUME_PATH
  );

  // 9. Wait for success message (proper assertion)
  await expect(
    page.getByText('Resume has been successfully uploaded')
  ).toBeVisible({ timeout: 60000 });

});

/*

const { test, expect } = require('@playwright/test');

test('Update Resume on Naukri', async ({ page }) => {
  await page.goto('https://www.naukri.com/' ,
    {
    waitUntil: 'domcontentloaded'
    }
);
  await page.click('text=Login');
  await page.fill('input[placeholder="Enter your active Email ID / Username"]', process.env.NAUKRI_EMAIL);
  await page.fill('input[placeholder="Enter your password"]', process.env.NAUKRI_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('https://www.naukri.com/mnjuser/homepage');
  await page.goto('https://www.naukri.com/mnjuser/profile');
  await page.click('text=Update Resume');
  await page.locator('input[type="file"]').waitFor({ state: 'visible' });
  await page.setInputFiles('input[type="file"]', process.env.NAUKRI_RESUME_PATH);
  
  // Wait for success message instead of fixed timeout
  await page.locator('text=Resume has been successfully uploaded').waitFor({ state: 'visible', timeout: 10000 });
  expect(page.locator('text=Resume has been successfully uploaded')).toBeVisible();
});

*/