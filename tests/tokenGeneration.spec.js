const { test } = require('@playwright/test');
const PageObjectClass = require('../pageObject/PageObjectClass.js');

test('Generate Token', async ({ page, context }) => {
  const pageObject = new PageObjectClass(page);

  await pageObject.goto('https://www.naukri.com/');

  await page.pause();

  await page.waitForURL('**/mnjuser/**');

  await context.storageState({
    path: 'storageState.json'
  });
});