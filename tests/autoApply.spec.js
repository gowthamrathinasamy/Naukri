const {test} = require('@playwright/test');
const PageObjectClass = require('../pageObject/PageObjectClass.js');

test('Auto Apply', async ({ page }) => {
const pageObject = new PageObjectClass(page);
await pageObject.autoApply();
console.log('Auto Apply test completed successfully for all recommended jobs.');

}
)