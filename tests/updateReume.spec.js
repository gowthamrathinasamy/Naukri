/*

const { test, expect } = require('@playwright/test');

test('Update Resume on Naukri', async ({ page }) => {

  // Stable desktop viewport for CI/headless
  await page.setViewportSize({
    width: 1440,
    height: 900
  });

  // Open direct login page
  await page.goto('https://www.naukri.com/nlogin/login', {
    waitUntil: 'domcontentloaded'
  });

  // Stabilization wait for CI runners
  await page.waitForTimeout(5000);

  // Email field
  const emailInput = page.locator('#usernameField');

  await emailInput.waitFor({
    state: 'visible',
    timeout: 60000
  });

  await emailInput.fill(process.env.NAUKRI_EMAIL);

  // Password field
  const passwordInput = page.locator('#passwordField');

  await passwordInput.waitFor({
    state: 'visible',
    timeout: 60000
  });

  await passwordInput.fill(process.env.NAUKRI_PASSWORD);

  // Login button
  const loginButton = page.locator('button[type="submit"]');


   await loginButton.click();

  // Wait for successful login
  await page.waitForURL(/mnjuser|homepage/, {
    timeout: 60000
  });

  // Open profile page
  await page.goto('https://www.naukri.com/mnjuser/profile', {
    waitUntil: 'domcontentloaded'
  });

  // Wait for profile page to settle
  await page.waitForTimeout(5000);

  // Upload resume
  const resumeUpload = page.locator('input[type="file"]');

  await resumeUpload.waitFor({
    state: 'attached',
    timeout: 60000
  });

  await resumeUpload.setInputFiles(
    process.env.NAUKRI_RESUME_PATH
  );

  // Validate upload success
  await expect(
    page.getByText(/successfully uploaded/i)
  ).toBeVisible({
    timeout: 60000
  });

});

*/

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
  await page.setInputFiles('input[type="file"]', process.env.NAUKRI_RESUME_PATH);
  
  // Wait for success message instead of fixed timeout
  await page.locator('text=Resume has been successfully uploaded').waitFor({ state: 'visible', timeout: 10000 });
  expect(page.locator('text=Resume has been successfully uploaded')).toBeVisible();
});

