import { expect, Page, test as base } from '@playwright/test';
import * as VersionStub from './data/version.json';
import * as LicenseStub from './data/license.json';
import * as ServerInfoStub from './data/server-info.json';
import * as AttributeTypesStub from './data/attribute-types/results.json';
import * as DataSourcesStub from './data/data-sources/results.json';
import * as StatsLoadedStub from './data/statistics/loaded.json';
import * as StatsSummaryStub from './data/statistics/summary.json';
/** common config endpoints */
import * as ConfApiStub from './data/config/api.json';
import * as ConfPackageStub from './data/config/package.json';
import * as ConfAuthStub from './data/config/auth.json';
/** landing page specific */
import * as StatsDataSourceSummaryStub1 from './data/statistics/summary/data-sources/CUSTOMERSvsCUSTOMERS.json';
import * as StatsDataSourceSummaryStub2 from './data/statistics/summary/data-sources/CUSTOMERSvsREFERENCE.json';
import * as StatsDataSourceSummaryStub3 from './data/statistics/summary/data-sources/REFERENCEvsREFERENCE.json';
/** graph page specific */
import * as GraphStub1 from './data/graph/entity-networks/1.json';
import * as GraphStub2 from './data/graph/entity-networks/1-networkMinimal.json';
import * as GraphStub3 from './data/graph/entity-networks/29-30-1-100002.json';
import * as GraphEntityStub from './data/graph/entities/1.json';

export class LandingPage {
    async openMenu() {
        const toolbarButton = await this.page.locator('app-toolbar .menu-button');
        await toolbarButton.click();
    }
    async goto() {
        await this.page.goto('/landing');
    }
    async toggleSearchBar() {
        const toggleNode    = await this.page.locator('.tool-tray mat-icon.toggle-icon').first();
        await toggleNode.click();
    }
    get menu() {
        return this.page.locator('.app-menu');
    }
    constructor(public readonly page: Page) {

    }
    async init() {
        await this.page.route('/api/statistics/summary/data-sources/CUSTOMERS/vs/CUSTOMERS?**', async route => {
            const json = StatsDataSourceSummaryStub1;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/statistics/summary/data-sources/CUSTOMERS/vs/REFERENCE?**', async route => {
            const json = StatsDataSourceSummaryStub2;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/statistics/summary/data-sources/REFERENCE/vs/REFERENCE?**', async route => {
            const json = StatsDataSourceSummaryStub3;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/api/statistics/loaded', async route => {
            const json = StatsLoadedStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/statistics/summary?onlyLoadedSources=false', async route => {
            const json = StatsSummaryStub;
            await route.fulfill({status: 200, json: json });
        });
    }
}
export class SearchPage {
    async goto() {
        await this.page.goto('/search');
    }
    constructor(public readonly page: Page) {

    }
    async init() {

    }
}
export class GraphPage {
    async goto() {
        await this.page.goto('/graph/1');
    }
    async toggleSearchBar() {
        const toggleNode    = await this.page.locator('.tool-tray mat-icon.toggle-icon').first();
        await toggleNode.click();
    }
    get entityNodes() {
        return this.page.locator('svg.graph-chart .sz-graph-node');
    }
    get primaryNode() {
        return this.page.locator('svg.graph-chart .sz-graph-primary-node');
    }
    get graphNode() {
        return this.page.locator('svg.graph-chart');
    }
    get topLevelGNode() {
        return this.page.locator('svg.graph-chart > g:first-child');
    }
    get filtersNode() {
        return this.page.locator('.right-rail sz-entity-detail-graph-filter');
    }
    get detailsNode() {
        return this.page.locator('.right-rail sz-entity-detail');
    }
    async getScale(): Promise<number> {
        let retVal = -1;
        const zoomedNode    = await this.topLevelGNode;
        const transform     = await zoomedNode.getAttribute('transform');

        //let retPromise = new Promise<number>((result) => {
            let scaleArr    = transform.split(' ');
            let scaleText   = scaleArr.length >= 1 ? scaleArr[1] : undefined;
            retVal          = scaleText &&  scaleText.includes('scale') ? parseFloat(scaleText.substring(scaleText.indexOf('(')+1, scaleText.indexOf(')'))) : -1;
        //});
        return retVal;
    }
    async getQueriedNodes() {
        return await this.graphNode.locator('.sz-graph-queried-node');
    }
    constructor(public readonly page: Page) {

    }
    async init() {
        /** 
        http://localhost:8251/api/entity-networks?e=1&maxDegrees=1&buildOut=1&maxEntities=40&detailLevel=MINIMAL&featureMode=NONE&withFeatureStats=false&withInternalFeatures=false&forceMinimal=true&withRaw=false
        
        http://localhost:8251/api/entity-networks?e=1&maxDegrees=1&buildOut=1&maxEntities=40000&detailLevel=NETWORK_MINIMAL&featureMode=NONE&withFeatureStats=false&withInternalFeatures=false&forceMinimal=false&withRaw=false

        http://localhost:8251/api/entities/1?detailLevel=SUMMARY&featureMode=NONE&withRelated=PARTIAL&withRaw=false

        http://localhost:8251/api/entity-networks?e=29&e=30&e=1&e=100002&maxDegrees=1&buildOut=0&maxEntities=100&detailLevel=SUMMARY&featureMode=NONE&withFeatureStats=false&withInternalFeatures=false&forceMinimal=false&withRaw=false
        */
        
        await this.page.route('/api/entity-networks?e=1&maxDegrees=1&buildOut=1&maxEntities=40&detailLevel=MINIMAL**', async route => {
            const json = GraphStub1;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/api/entity-networks?e=1&maxDegrees=1&buildOut=1&maxEntities=40000&detailLevel=NETWORK_MINIMAL**', async route => {
            const json = GraphStub2;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/api/entities/1?detailLevel=SUMMARY**', async route => {
            const json = GraphEntityStub;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/api/entity-networks?e=29&e=30&e=1&e=100002**', async route => {
            const json = GraphStub3;
            await route.fulfill({status: 200, json: json });
        });
    }
}
export class BasePage {
    async init() {
        /** set up stub responses */
        await this.page.route('/api/version', async route => {
            const json = VersionStub;
            //console.log(`---------------- VERSION INTERCEPTED ----------------`);
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/license', async route => {
            const json = LicenseStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/server-info', async route => {
            const json = ServerInfoStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/attribute-types', async route => {
            const json = AttributeTypesStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/api/data-sources', async route => {
            const json = DataSourcesStub;
            await route.fulfill({status: 200, json: json });
        });
        /*
        await page.route('/api/statistics/loaded', async route => {
            const json = StatsLoadedStub;
            await route.fulfill({status: 200, json: json });
        });
        await page.route('/api/statistics/summary?onlyLoadedSources=false', async route => {
            const json = StatsSummaryStub;
            await route.fulfill({status: 200, json: json });
        });*/
        
        await this.page.route('/config/api', async route => {
            const json = ConfApiStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/config/auth', async route => {
            const json = ConfAuthStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/config/package', async route => {
            const json = ConfPackageStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/config/console', async route => {
            const json = ConfPackageStub;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('/config/streams', async route => {
            const json = ConfPackageStub;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/config/health', async route => {
            const json = ConfPackageStub;
            await route.fulfill({status: 200, json: json });
        });

        await this.page.route('/api/app/projects**', async route => {
            route.abort();
        });
    }
    constructor(public readonly page: Page) {
        
    }
    
}