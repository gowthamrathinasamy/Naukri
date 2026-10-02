const { test, expect } = require('@playwright/test');
const PageObjectClass = require('../pageObject/PageObjectClass.js');

test('Update Resume on Naukri', async ({ page, browser, context }) => {


  const pageObject = new PageObjectClass(page);

  await pageObject.goto('https://www.naukri.com/mnjuser/homepage');
  await pageObject.goto('https://www.naukri.com/mnjuser/profile');

  await pageObject.updateResume(process.env.NAUKRI_RESUME_PATH);

  await expect(
    page.locator('text=Resume has been successfully uploaded')
  ).toBeVisible({ timeout: 10000 });

  await context.close();
});