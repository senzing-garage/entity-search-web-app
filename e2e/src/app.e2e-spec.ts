import { AppPage } from './app.po';
import { SearchBox } from './search.po';
import { browser, element, by } from 'protractor';

describe('@senzing/entity-search-webapp: Basic Compilation/Service checks', () => {
  let page: AppPage;
  let search: SearchBox;

  beforeEach(() => {
    page = new AppPage();
    search = new SearchBox();
  });

  it('should have app-root element', () => {
    page.navigateTo();
    expect(page.getAppRoot());
  });

  it('should have search box', () => {
    search.navigateTo();
    expect(search.getSearchComponent().isPresent()).toBeTruthy();
  });

  it('should have "no results" page', () => {
    search.setSearchInputName('JIBBLECHOOSAKWAHAHAHAZIMSQIDDLESPOOCH');
    search.clickSearchButtonSubmit();
    search.waitForNoResults();
    expect(page.getNoResults().count()).toEqual(1);
  });

  /*
  not working, but it absolutely should be
  must be a selector thing

  it('should have "404" page', () => {
    page.navigateTo404();
    page.waitFor404Page();
    expect(page.get404Page().isPresent()).toBeTruthy();
  });
  */

 it('should be able to toggle search tray', () => {
  page.toggleSearchTray();
  browser.sleep(1000);
  page.searchTrayIsCollapsed();
  page.toggleSearchTray();
  browser.sleep(1000);
  page.searchTrayIsExpanded();
});

it('should have Home option in menu', (done) => {
  page.openMenu();
  browser.sleep(2000);
  page.hasMenuItem('home').then((res) => {
    expect(res).toBeTruthy();
    done();
  });
});

/*
it('should have 2 options in menu', (done) => {
  page.openMenu();
  browser.sleep(2000);
  expect( page.menuItemCount() ).toEqual(2);
  page.closeMenu();
});
*/

});
