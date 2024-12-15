import { expect, Page, test as base } from '@playwright/test';
import { chromium } from 'playwright';

import * as NameSearchStub from './data/search/Jimmy Bingo/results.json'
import * as EntityDetailsStub from './data/entities/Jimmy Bingo/results.json';
import * as NameAndDobSearchStub from './data/search/name+dob/results.json';
import * as NameAndPhoneSearchStub from './data/search/name+phone/results.json';
import * as NameAndAddressSearchStub from './data/search/name+address/results.json';

import { LandingPage, SearchPage, BasePage} from './pageFixtures';

// Extend basic test by providing a "LandingPage" fixture.
const test = base.extend<{ landingPage: LandingPage, searchPage: SearchPage, basePage: BasePage }>({
    landingPage: async ({ page }, use) => {
        const landingPage = new LandingPage(page);
        await landingPage.init();
        await landingPage.goto();
        await use(landingPage);
    },
    searchPage: async ({ page }, use) => {
        const searchPage = new LandingPage(page);
        await searchPage.init();
        await searchPage.goto();
        await use(searchPage);
    },
    page: async ({ page }, use) => {
        /** set up global stub responses */
        const basePage = new BasePage(page);
        await basePage.init();
        await use(page);
    }
});

test.describe('Search Tests', () => {
    test('should have search box', async ({ landingPage, page }) => {
        //await landingPage.goto('/search');
        const searchComponentNode = await page.locator('sz-search');
        await expect(searchComponentNode).toHaveCount(1);
    });

    test('should have powered by menu', async ({ landingPage, page }) => {
        //await landingPage.goto();
        const versionNode   = await page.locator('sz-powered-by').first();
        //await expect(versionNode).toHaveCount(1);
        await versionNode.click({force: true});
        const menuNode      = await page.locator('app-about');
        await expect(menuNode).toHaveCount(1);
    });
    
    test('should have SSN in type pulldown', async ({ searchPage, page }) => {
        let identifierNode = await page.locator('select#entity-type');
        await expect(identifierNode).toHaveCount(1);
        identifierNode  = await identifierNode.first().locator('option[value=SSN_NUMBER]');
        await expect(identifierNode).toHaveCount(1);
    });
    
    test('submit button should be clickable', async ({ landingPage, page }) => {
        //await page.goto('/search');
        const submitButton      = await page.locator('button.button__search-go');
        const submitButtonCount = await submitButton.count();
        await expect(submitButtonCount).toBeGreaterThan(0);
        await expect(await submitButton.first()).toBeEnabled();
    });
    
    test('landing should be able to search by name', async({ landingPage, page }) => {
        await page.route('/api/entities?**', async route => {
            const json = NameSearchStub;
            await route.fulfill({status: 200, json: json });
        });
        await page.click('input[id="entity-name"]');
        //await page.pause();
        await page.fill('#entity-name', 'Robert Smith');
        //await page.pause();

        //button__search-go mdc-button mat-mdc-button _mat-animation-noopable mat-unthemed mat-mdc-button-base cdk-focused cdk-mouse-focused
        const submitButton = await page.locator('button.button__search-go').first(); // there are actually 2 of these, we want the first one
        await expect(submitButton).toHaveCount(1);
        //await page.pause();
        await submitButton.click({force: true});
        //await page.pause();

        // get the 3 results
        const searchResults = await page.locator('sz-search-result-card');
        await expect(searchResults).toHaveCount(3);
    })
    
    // should have dob field
    test('should have dob field', async({ searchPage, page }) => {
        const field = await page.locator('input#entity-dob');
        await expect(field).toHaveCount(1);
    })

    // should have address field
    test('should have address field', async({ searchPage, page }) => {
        const field = await page.locator('input#entity-address');
        await expect(field).toHaveCount(1);
    })

    // should have dob fieldl
    test('should have email field', async({ searchPage, page }) => {
        const field = await page.locator('input#entity-email');
        await expect(field).toHaveCount(1);
    })
    
    
    test('should have exact match for Name + DOB search', async({ searchPage, page }) => {
        //await page.goto('/search');
        const nameField     = await page.locator('input#entity-name');
        const dobField      = await page.locator('input#entity-dob');
        const submitButton  = await page.locator('button.button__search-go').first();
        const pageChanged   = page.waitForURL("**\/search\/results\/**",{ timeout: 5000 });

        await page.route('/api/entities?**', async route => {
            const json = NameAndDobSearchStub;
            await route.fulfill({status: 200, json: json });
        });

        await nameField.fill("Robert Smith");
        await dobField.fill("3/31/54");
        await submitButton.click();
        // submit causes route change, wait for response
        await pageChanged.catch(error => { console.log('got response error'); });
        // wait a half sec for the request to render
        // (yes I know this is bad practice but the way of waiting for a response to a specific route(ie: "/api/entities?**")) doesnt work for some reason
        //await page.waitForResponse('/api/entities?**', { timeout: 500 }).catch(err => {});
        // make sure there is at least one "matches" node
        const resultNode    = await page.locator('sz-search-result-card.matches');
        await expect(await resultNode.count()).toBeGreaterThanOrEqual(1);
    });
    
    test('should have possibly related for Name + Phone Number', async ({ searchPage, page }) => {
        //await page.goto('/search');
        const nameField     = await page.locator('input#entity-name');
        const phoneField    = await page.locator('input#entity-phone');
        const submitButton  = await page.locator('button.button__search-go').first();
        const pageChanged   = page.waitForURL("**\/search\/results\/**",{ timeout: 5000 });

        await page.route('/api/entities?**', async route => {
            const json = NameAndPhoneSearchStub;
            await route.fulfill({status: 200, json: json });
        });

        await nameField.fill("Robert Smith");
        await phoneField.fill("702-919-1300");
        await submitButton.click();
        // submit causes route change, wait for response
        await pageChanged.catch(error => { console.log('got response error'); });
        // make sure there is at least one "possible matches" node
        const resultNode    = await page.locator('sz-search-result-card.possible-match')
        await expect(await resultNode.count()).toBeGreaterThanOrEqual(2);
    });

    test('should have exact match for Name + Address', async ({ searchPage, page }) => {
        //await page.goto('/search');
        const nameField     = await page.locator('input#entity-name');
        const addressField  = await page.locator('input#entity-address');
        const submitButton  = await page.locator('button.button__search-go').first();
        const pageChanged   = page.waitForURL("**\/search\/results\/**",{ timeout: 5000 });
        await page.route('/api/entities?**', async route => {
            const json = NameAndAddressSearchStub;
            await route.fulfill({status: 200, json: json });
        });
        await nameField.fill("Robert Smith");
        await addressField.fill("123 E Main St Henderson NV 89132");
        await submitButton.click();
        // submit causes route change, wait for response
        await pageChanged.catch(error => { console.log('got response error'); });
        // make sure there is one exact match
        const resultNode    = await page.locator('sz-search-result-card.matches');
        //await page.pause();
        await expect(await resultNode.count()).toBeGreaterThanOrEqual(2);
    });

});