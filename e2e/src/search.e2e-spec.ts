import { SearchBox } from './search.po';
import { browser, until, by, $$, $ } from 'protractor';

describe('@senzing/entity-search-webapp: Basic Search functionality', () => {
  let search: SearchBox;

  beforeEach(() => {
    search = new SearchBox();
  });

  it('should have search box', () => {
    search.navigateTo();
    expect(search.getSearchComponent().isPresent()).toBeTruthy();
  });

  it('should have SSN in identifier pulldown', () => {
    expect(search.existsSearchIdentifierOptionByValue('SSN_NUMBER')).toBeTruthy();
  });

  it('submit button should be clickable', () => {
    expect(search.getSearchButtonSubmit().isEnabled).toBeTruthy();
  });

  it('should be able to search by name', () => {
    search.setSearchInputName('Jenny Smith');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getSearchResults().count()).toEqual(1);
  });

});
