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


export class LandingPage {
    async goto() {
        await this.page.goto('/landing');
    }
    constructor(public readonly page: Page) {

    }
    async init() {
        await this.page.route('/api/statistics/summary/data-sources/CUSTOMERS/vs/CUSTOMERS?**', async route => {
            const json = StatsDataSourceSummaryStub1;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('http://localhost:4200/api/statistics/summary/data-sources/CUSTOMERS/vs/REFERENCE?**', async route => {
            const json = StatsDataSourceSummaryStub2;
            await route.fulfill({status: 200, json: json });
        });
        await this.page.route('http://localhost:4200/api/statistics/summary/data-sources/REFERENCE/vs/REFERENCE?**', async route => {
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
    }
    constructor(public readonly page: Page) {
        
    }
    
}