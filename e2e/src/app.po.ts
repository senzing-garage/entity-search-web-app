import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getAppRoot() {
    return element(by.css('app-root'));
  }
}
