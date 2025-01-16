import { expect, Page, test as base } from '@playwright/test';
import { GraphPage, BasePage} from './pageFixtures';

// Extend basic test by providing a "LandingPage" fixture.
const test = base.extend<{ graphPage: GraphPage, basePage: BasePage }>({
    graphPage: async ({ page }, use) => {
        const graphPage = new GraphPage(page);
        await graphPage.init();
        await graphPage.goto();
        await use(graphPage);
    },
    page: async ({ page }, use) => {
        /** set up global stub responses */
        const basePage = new BasePage(page);
        await basePage.init();
        await use(page);
    }
});

test.describe('Graph Tests', () => {
    test('should have 4 initial nodes', async ({ graphPage, page }) => {
        const resultNodes = await graphPage.entityNodes;
        await expect(resultNodes).toHaveCount(4);
    });

    test('can zoom', async ({ graphPage, page }) => {
        await graphPage.toggleSearchBar();
        // wait for animation to finish
        await page.waitForTimeout(2000);
        // move mouse over canvas and scroll
        await page.mouse.move(200,200);
        await page.mouse.wheel(0, -200);
        // get graph scale
        let scaleFloat      = await graphPage.getScale();
        //console.log('new transform: '+ scaleFloat +'  |  '+ (scaleFloat > 1));
        // make sure scale is greater than "1" after zooming
        await expect(scaleFloat).toBeGreaterThan(1);
    });
    

    test('can expand connected nodes', async ({ graphPage, page }) => {
        await graphPage.toggleSearchBar();
        // wait for animation to finish
        await page.waitForTimeout(2000);
        const expandableNode    = await graphPage.graphNode.locator('.sz-graph-node.has-collapsed-edges').first();
        // should only be "1" initial expandable node
        const expGlyph          = await expandableNode.locator('.sz-graph-icon-edge-toggle').first();
        await expGlyph.click({force: true});
        const queriedNodes      = await graphPage.getQueriedNodes();
        await expect(queriedNodes).toHaveCount(4);
    });

    test('should have 3 datasources in filters', async ({ graphPage, page }) => {
        let dataSourcesToBePresent = ["CUSTOMERS", "REFERENCE", "WATCHLIST"];
        let filterElements  = (await graphPage.filtersNode.locator('.filters-list li label').allTextContents()).map((arrTxt)=> { return arrTxt.trim(); });
        //console.log('filter values: ', filterElements);
        await expect(dataSourcesToBePresent).toEqual(expect.arrayContaining(filterElements));
        // should be "CUSTOMERS ", "REFERENCE ", "WATCHLIST "
    });
});