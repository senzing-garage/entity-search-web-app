import { browser, by, element, $, $$, ExpectedConditions as EC } from 'protractor';

export class SearchBox {
  navigateTo() {
    return browser.get('/');
  }

  getAppRoot() {
    return element(by.css('app-root'));
  }

  getSearchComponent() {
    return element(by.tagName('sz-search'));
  }

  getSearchButtonSubmit() {
    return this.getSearchComponent().$('.button__search-go');
  }

  getSearchButtonClear() {
    return this.getSearchComponent().$('.button__search-clear');
  }

  async clearSearchResults() {
    return (this.getSearchButtonClear().click());
  }

  clickSearchButtonSubmit() {
    return this.getSearchButtonSubmit().click();
  }

  getSearchInputName() {
    return this.getSearchComponent().$('#entity-name');
  }

  setSearchInputName(value: string) {
    this.getSearchInputName().click();
    this.getSearchInputName().sendKeys(value);
  }

  getSearchInputNameValue() {
    return this.getSearchInputName().getAttribute('value');
  }

  getSearchDOB() {
    return this.getSearchComponent().$('#entity-dob');
  }
  setSearchDOB(value) {
    this.getSearchDOB().click();
    this.getSearchDOB().sendKeys(value);
  }

  getSearchAddress() {
    return this.getSearchComponent().$('#entity-address');
  }
  setSearchAddress(value) {
    this.getSearchAddress().click();
    this.getSearchAddress().sendKeys(value);
  }

  getSearchPhone() {
    return this.getSearchComponent().$('#entity-phone');
  }
  setSearchPhone(value) {
    this.getSearchPhone().click();
    this.getSearchPhone().sendKeys(value);
  }

  getSearchInputIdentifier() {
    return this.getSearchComponent().$('select.identifier-dropdown');
  }

  getSearchIdentifierOptionByValue(value: string) {
    return this.getSearchInputIdentifier().$('[value="' + value + '"]');
  }

  getSearchIdentifierOptionByTextSelector(value: string) {
    return `select.identifier-dropdown option[text=${value}]`;
  }

  getSearchIdentifierOptionByText(value: string) {
    return this.getSearchInputIdentifier().$('[text="' + value + '"]');
  }

  existsSearchIdentifierOptionByText(value: string) {
    return this.getSearchInputIdentifier().$(`option[text=${value}]`).isPresent();
  }

  existsSearchIdentifierOptionByValue(value: string) {
    return this.getSearchInputIdentifier().$(`option[value=${value}]`).isPresent();
  }

  getSearchResults() {
    return element.all(by.css('sz-search-result-card'));
  }

  getSearchResultNames() {
    return element.all(by.css('.search__link span')).getText();
  }

  getTopSearchResultName() {
    const _p = new Promise((resolve) => {
      element.all(by.css('.search__link span')).first().getText().then((res) => {
        resolve(res.trim());
      });
    });

    return _p;
  }

  getMatches() {
    return element.all(by.css('.sz-search-result-card-wrapper.matches'));
  }

  getNameOnly() {
    return element.all(by.css('.sz-search-result-card-wrapper.name-only'));
  }

  getPossibleMatches() {
    return element.all(by.css('.sz-search-result-card-wrapper.discovered-relationships'));
  }

  getRelationships() {
    return element.all(by.css('.sz-search-result-card-wrapper.possible-match'));
  }

  waitForSearchResults() {
    const res = element.all(by.css('.search__link span'));
    browser.wait(EC.visibilityOf(res.first()), 10000, 'search.po.waitForSearchResults timed out');
  }

  waitForNoResults() {
    const res = element.all(by.css('app-no-results'));
    browser.wait(EC.visibilityOf(res.first()), 10000, 'search.po.waitForNoResults timed out');
  }
}
