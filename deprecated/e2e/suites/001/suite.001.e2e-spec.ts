import { SearchBox } from '../../src/search.po';
import { DetailPage } from '../../src/detail.po';
import { browser, until, by, $$, $ } from 'protractor';

describe('@senzing/entity-search-webapp: Suite 1 - Owners/Companies DS - Search', () => {
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

  it('search for "Jenny Smith"', (done) => {
    search.clearSearchResults();
    search.setSearchInputName('Jenny Smith');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    search.getTopSearchResultName().then((res) => {
          expect(res).toBe('Jenny Smith');
          done();
    });
  });

  it('should have exact match for Name + DOB search', () => {
    search.clearSearchResults();
    search.setSearchInputName('Jenny Smith');
    search.setSearchDOB('1982-02-02');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getMatches().count()).toBeGreaterThan(0);
  });

  it('should NOT have any matches for Name + incorrect DOB search', () => {
    search.clearSearchResults();
    search.setSearchInputName('Jenny Smith');
    search.setSearchDOB('1982-11-02');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getMatches().count()).toBeLessThan(1);
  });

  it('should have possibly related for Name + Phone Number', () => {
    search.clearSearchResults();
    search.setSearchInputName('Jenny Smith');
    search.setSearchPhone('702-111-1111');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getPossibleMatches().count()).toBeGreaterThanOrEqual(1);
  });

  it('should have exact match for Name + Address', () => {
    search.clearSearchResults();
    search.setSearchInputName('Jenny Smith');
    search.setSearchAddress('808 STAR COURT LAS VEGAS NV 89222');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getMatches().count()).toBeGreaterThanOrEqual(1);
  });

  it('should have possibly related for just Address', () => {
    search.clearSearchResults();
    search.setSearchAddress('808 STAR COURT LAS VEGAS NV 89222');
    search.clickSearchButtonSubmit();
    search.waitForSearchResults();
    expect(search.getPossibleMatches().count()).toBeGreaterThanOrEqual(1);
  });

});

describe('@senzing/entity-search-webapp: Suite 1 - Owners/Companies DS - Detail Page', () => {
  let search: SearchBox;
  let detail: DetailPage;

  beforeAll(() => {
    detail = new DetailPage();
  });

  beforeEach(() => {
    search = new SearchBox();
    browser.waitForAngularEnabled(true);
  });

  it('user icon should be no smaller than 120x120', async () => {
    browser.waitForAngularEnabled(false);
    detail.navigateTo( 1002 );
    detail.waitForUserIcon();
    const icoSize = await detail.getUserIconSize();
    expect( Math.ceil(icoSize.width) ).toBeGreaterThanOrEqual(120);
    expect( Math.ceil(icoSize.height) ).toBeGreaterThanOrEqual(120);
  });

  it('should be able to toggle graph section', async () => {
    browser.waitForAngularEnabled(false);
    detail.navigateTo( 1002 );
    detail.waitForGraphSection();
    await detail.toggleGraphSection();
    expect( await detail.graphIsCollapsed() ).toBeTruthy();
  });

  it('"possible matches" can collapse/expand', async () => {
    browser.waitForAngularEnabled(false);
    detail.navigateTo( 1001 );
    await detail.waitForPossibleMatchesSection();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    await detail.toggleCollapseableSection('possible');
    // browser.sleep(5000);
    // console.log('collapse/expand 1');
    await expect( await detail.sectionIsCollapsed('possible') ).toBeTruthy();
    // console.log('collapse/expand 2');
  });

  it('"disclosed relationships" can collapse/expand', async () => {
    browser.waitForAngularEnabled(false);
    detail.navigateTo( 1001 );
    await detail.waitForPossibleMatchesSection();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    await detail.toggleCollapseableSection('disclosed');
    // browser.sleep(5000);
    // console.log('collapse/expand 1');
    await expect( await detail.sectionIsCollapsed('disclosed') ).toBeTruthy();
    // console.log('collapse/expand 2');
  });

  it('should be able to navigate to "Jenny Smith"', () => {
    detail.navigateTo( 1002 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
  });

  it('should be able to navigate to "Steve Smith"', () => {
    detail.navigateTo( 1001 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
  });

  it('should be able to navigate to "ABC Company"', () => {
    detail.navigateTo( 1 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Abc Company');
  });

  it('"ABC Company" should have 1 match', () => {
    detail.navigateTo( 1 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Abc Company');
    expect( detail.getSectionSummaryCount('matches') ).toBe(1);
  });

  it('"ABC Company" should have 4 relationships', () => {
    detail.navigateTo( 1 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Abc Company');
    expect( detail.getSectionSummaryCount('disclosed') ).toBe(4);
  });

  it('"Steve Smith" should have 1 match', () => {
    detail.navigateTo( 1001 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    expect( detail.getSectionSummaryCount('matches') ).toBe(1);
  });

  it('"Steve Smith" should have 2 possible matches', () => {
    detail.navigateTo( 1001 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    expect( detail.getSectionSummaryCount('possible') ).toBe(2);
  });

  it('"Steve Smith" should have 0 possible relationships', () => {
    detail.navigateTo( 1001 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    expect( detail.getSectionSummaryCount('relationships') ).toBe(0);
  });

  it('"Steve Smith" should have 1 disclosed relationships', () => {
    detail.navigateTo( 1001 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    expect( detail.getSectionSummaryCount('disclosed') ).toBe(1);
  });

  it('"Jenny Smith" should have 1 match', () => {
    detail.navigateTo( 1002 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
    expect( detail.getSectionSummaryCount('matches') ).toBe(3);
  });

  it('"Jenny Smith" should have 0 possible matches', () => {
    detail.navigateTo( 1002 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
    expect( detail.getSectionSummaryCount('possible') ).toBe(0);
  });

  it('"Jenny Smith" should have 0 possible relationships', () => {
    detail.navigateTo( 1002 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
    expect( detail.getSectionSummaryCount('relationships') ).toBe(0);
  });

  it('"Jenny Smith" should have 1 disclosed relationships', () => {
    detail.navigateTo( 1002 );
    detail.waitForDisplayedName();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
    expect( detail.getSectionSummaryCount('disclosed') ).toBe(3);
  });

  it('"Jenny Smith" should have 3 records in datasources section', async () => {
    detail.navigateTo( 1002 );
    detail.waitForDataSourcesSection();
    expect( detail.getDisplayedName() ).toBe('Jenny Smith');
    expect( detail.getDataSourceRecordCount() ).toBe(3);
  });

  it('3rd "Steve Smith" should have 2 ambiguous possible matches', async () => {
    detail.navigateTo( 1005 );
    await detail.waitForPossibleMatchesSection();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    const itemCount = await detail.getPossibleMatchItemCount();
    expect( itemCount ).toBe(2);
    const hasAmb = await detail.getPossibleMatchesHasAmbiguous();
    expect( hasAmb ).toBeTruthy();
  });

  it('3rd "Steve Smith" should have 1 disclosed relationship', async () => {
    detail.navigateTo( 1005 );
    await detail.waitForDisclosedSection();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    expect( detail.getDisclosedItemCount() ).toBe(1);
    expect( await detail.getPossibleMatchesHasAmbiguous() ).toBeTruthy();
  });

  it('3rd "Steve Smith" should have 1 disclosed relationship with a "ownership" match key', async () => {
    detail.navigateTo( 1005 );
    await detail.waitForDisclosedSection();
    expect( detail.getDisplayedName() ).toBe('Steve Smith');
    const hasKey = await detail.getDisclosedMatchesHasMatchKey('ownership');
    expect( hasKey ).toBeTruthy();
  });

  it('"BNC Connections" should have 3 disclosed relationships with a "ownership" match key', async () => {
    detail.navigateTo( 3 );
    await detail.waitForDisclosedSection();
    expect( detail.getDisplayedName() ).toBe('Bnc Connections');
    const hasKey = await detail.getDisclosedMatchesHasMatchKey('ownership');
    expect( hasKey ).toBeTruthy();
  });



});
