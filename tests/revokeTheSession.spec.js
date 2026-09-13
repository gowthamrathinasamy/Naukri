import {test} from '@playwright/test';
import PageObjectClass from '../pageObject/PageObjectClass.js';

test('Revoke the Session', async ({ page, context }) => {
 
  await page.goto('https://www.naukri.com/');
  await page.pause();

}
)