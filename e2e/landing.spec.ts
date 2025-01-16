import { expect, Page, test as base } from '@playwright/test';
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

test.describe('Landing Page Tests', () => {
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

    test('should be able to toggle search tray', async ({ landingPage, page }) => {
        const trayNode      = await page.locator('.tool-tray');
        const toggleNode    = await page.locator('.tool-tray mat-icon.toggle-icon').first();
        await toggleNode.click();
        await page.pause();
        await expect(trayNode).not.toHaveClass('expanded');
    });
    
    test('should have Home option in menu', async ({ landingPage, page }) => {
        await landingPage.openMenu();
        //const menuNode      = await page.locator('.app-menu');
        const button    = await landingPage.menu.locator('.mat-mdc-menu-item[routerLink="/"]');
        await page.pause();
        await expect(button).toHaveCount(1);
        //await expect(trayNode).not.toHaveClass('expanded');
    });

    test('should have Cross Source option in menu', async ({ landingPage, page }) => {
        await landingPage.openMenu();
        //const menuNode      = await page.locator('.app-menu');
        const button    = await landingPage.menu.locator('.mat-mdc-menu-item[routerLink="/sample"]');
        await page.pause();
        await expect(button).toHaveCount(1);
        //await expect(trayNode).not.toHaveClass('expanded');
    });
});