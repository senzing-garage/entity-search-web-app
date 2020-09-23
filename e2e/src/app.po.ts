import { browser, by, element, ExpectedConditions as EC, $$, $ } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  navigateTo404() {
    return browser.get('/932847');
  }

  getAppRoot() {
    return element(by.css('app-root'));
  }

  waitFor404Page() {
    const res = this.get404Page();
    browser.wait(EC.presenceOf(res.first()), 10000, 'search.po.waitFor404Page timed out');
  }

  get404Page() {
    return element.all(by.tagName('app-page-not-found'));
  }

  getErrorCodeNode(code) {
    const res = element.all(by.css(`app-error-page[code=${code}]`));
    return res;
  }

  getSearchTrayIcon() {
    return element.all(by.css('.toggle-icon'));
  }

  getExpandedSearchTray() {
    return element.all(by.css('.tool-tray.expanded'));
  }

  searchTrayIsCollapsed() {
    expect( element(by.css('.tool-tray')).getAttribute('class') ).toBe('tool-tray');
  }
  searchTrayIsExpanded() {
    expect( element(by.css('.tool-tray')).getAttribute('class') ).toBe('tool-tray expanded');
  }

  toggleSearchTray() {
    return this.getSearchTrayIcon().first().click();
  }

  waitForErrorCodePage( code ) {
    const res = element.all(by.css('.error-' + code));
    browser.wait(EC.visibilityOf(res.first()), 10000, 'search.po.waitForErrorCodePage timed out');
  }

  waitForNoResults() {
    const res = element.all(by.css('app-no-results'));
    browser.wait(EC.visibilityOf(res.first()), 10000, 'search.po.waitForNoResults timed out');
  }

  getNoResults() {
    return element.all(by.css('app-no-results'));
  }

  getMenuIcon() {
    return element(by.css('app-toolbar .mat-icon-button'));
  }

  openMenu() {
    this.getMenuIcon().click();
  }

  async openMenuItem(buttonName) {
    const settingsMenu = $$('div.mat-menu-content button');
    let menuItems;
    await settingsMenu.then((items) => {
      menuItems = items;
      return Promise.resolve('');
    });

    let chosenItem;
    for (const item of menuItems) {
      await browser.wait(EC.visibilityOf(item), 20000, 'too long (openMenuItem) 1');
      const buttonTitle = await item.getText();
      if (buttonTitle === buttonName) {
        chosenItem = item;
      }
    }
    return chosenItem.click();
  }

  async closeMenu() {
    this.getMenuIcon().click();
  }

  async menuItemCount() {
    const settingsMenu = element('div.mat-menu-content');
    const menuItems = element.all(by.css('div.mat-menu-content .mat-menu-item'));
    return menuItems.count();
  }

  async hasMenuItem(buttonName) {
    return new Promise(async (resolve, reject) => {
      const settingsMenu = $$('div.mat-menu-content mat-icon');
      let menuItems;
      await settingsMenu.then((items) => {
        menuItems = items;
        return Promise.resolve('');
      });

      let chosenItem;
      for (const item of menuItems) {
        await browser.wait(EC.visibilityOf(item), 2000, 'too long (hasMenuItem) 1');
        const buttonTitle = await item.getText();
        if (buttonTitle === buttonName) {
          chosenItem = item;
        }
      }
      if (chosenItem) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async exitOverlay() {
    return element( by.css('.cdk-overlay-backdrop') ).click();
  }


}
