import { expect, test } from '@playwright/test';
import * as NameSearchStub from './data/search/Jimmy Bingo/results.json'
import * as EntityDetailsStub from './data/entities/Jimmy Bingo/results.json'


/*
test('has title', async ({ page }) => {
  await page.goto('/');
  await page.pause();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Senzing POC App/);
});

test('can search by name', async({ page }) => {
  await page.goto('/');
  await page.pause();
  await page.click('input[id="entity-name"]');
  await page.pause();
  await page.fill('#entity-name', 'Robert Smith');
  await page.pause();

  //button__search-go mdc-button mat-mdc-button _mat-animation-noopable mat-unthemed mat-mdc-button-base cdk-focused cdk-mouse-focused
  const submitButton = await page.locator('button.button__search-go').first(); // there are actually 2 of these, we want the first one
  console.log('button', await submitButton.allTextContents());
  await expect(submitButton).toHaveCount(1);
  await page.pause();
  await submitButton.click({force: true});
  await page.pause();
})
*/
test('has correct search results', async({ page }) => {
  // Mock the api call before navigating
  await page.route('/api/entities?**', async route => {
    const json = NameSearchStub;
    await route.fulfill({status: 200, json: json });
  });

  await page.goto('/');
  await page.click('input[id="entity-name"]');
  await page.fill('#entity-name', 'Jimmy Bingo');
  const submitButton = await page.locator('button.button__search-go').first();
  await page.pause();

  await submitButton.click({force: true});
  // after the submit user will be redirected to results page
  await page.pause();

  // get the 3 results
  const searchResults = await page.locator('sz-search-result-card');
  await expect(searchResults).toHaveCount(3);

  await page.pause();

  // the first result should be "Jimmy Bingo"
  await expect(searchResults.nth(0).locator('header .search__link')).toHaveText('Jimmy Bingo');

  //await expect(page.getByText('Strawberry')).toBeVisible();
  await page.pause();
})