import { browser, by, element, $, $$, ExpectedConditions as EC } from 'protractor';

export class DetailPage {
  navigateTo( entityId ) {
    return browser.get(`/entity/${entityId}`);
  }

  async getDisplayedName() {
    const selector = element(by.css('.detail-header__entity-name'));
    return selector.getText();
  }

  async waitForDisplayedName() {
    await browser.wait( EC.presenceOf(element(by.css('.detail-header__entity-name'))) );
  }

  async getSectionSummaryCount( matchType ) {
    const keysToSelector = {
      'matches': '.section-summary__wrapper.matched-records .section-summary__count',
      'possible': '.section-summary__wrapper.possible-matches .section-summary__count',
      'relationships': '.section-summary__wrapper.possible-relationships .section-summary__count',
      'disclosed': '.section-summary__wrapper.disclosed-relationships .section-summary__count'
    };
    const text = await element( by.css(keysToSelector[matchType]) ).getText();
    return parseInt(text, 10);
  }

  getDataSourceRecordCount() {
    return (element.all(by.css('.search-card-records sz-entity-record-card-content'))).count();
  }

  async waitForDataSourcesSection() {
    await browser.wait( EC.presenceOf( element(by.css('.search-card-records')) ) );
  }

  getGraphNode() {
    return element(by.css('.sz-relationship-network-graph'));
  }

  getGraphSVG() {
    return element(by.css('.sz-relationship-network-graph svg.graph-chart'));
  }

  async getGraphSectionHeader() {
    return element(by.css('.section-header__wrapper.graph-relationships'));
  }

  async toggleGraphSection() {
    const ele = await this.getGraphSectionHeader();
    return ele.click();
  }

  async graphIsCollapsed() {
    return element(by.css('.section-header__wrapper.graph-relationships.closed')).isPresent();
  }

  async graphIsExpanded() {
    return element(by.css('.section-header__wrapper.graph-relationships.open')).isPresent();
  }

  async waitForGraphSection() {
    await browser.wait( EC.presenceOf( await this.getGraphSectionHeader() ) );
  }

  async waitForUserIcon() {
    await browser.wait( EC.presenceOf( await this.getUserIcon() ));
  }

  async getUserIcon() {
    return element(by.css('svg.icon-user'));
  }

  async getUserIconSize() {
    return (await this.getUserIcon()).getSize();
  }

  async waitForPossibleMatchesSection() {
    await browser.wait( EC.presenceOf( element(by.css('.details-section.possible')) ), 5000 );
  }

  async waitForDisclosedSection() {
    await browser.wait( EC.presenceOf( element(by.css('.details-section.disclosed')) ), 5000 );
  }

  async waitForDiscoveredSection() {
    await browser.wait( EC.presenceOf( element(by.css('.details-section.discovered')) ), 5000 );
  }

  getPossibleMatchItemCount() {
    return element.all(by.css('sz-entity-details-section.possible .entity-record')).count();
  }

  getDisclosedItemCount() {
    return element.all(by.css('sz-entity-details-section.disclosed .entity-record')).count();
  }

  getDiscoveredItemCount() {
    return element.all(by.css('sz-entity-details-section.discovered .entity-record')).count();
  }

  async getSectionHasMatchPill( sectionEle, pillClass ) {
    const sel = `.sz-match-pill-element.${pillClass}`;
    const ele = sectionEle.element( by.css(sel));
    return browser.wait( EC.presenceOf( ele ), 5000);
  }

  async getPossibleMatchesHasAmbiguous() {
    const hasAmbig = await this.getSectionHasMatchPill( element(by.css('sz-entity-details-section.possible')), 'is-ambiguous' );
    return hasAmbig;
  }

  async getSectionHasMatchPillByKey( sectionEle, keyName) {
    return this.getSectionHasMatchPill( sectionEle, keyName );
  }

  async getPossibleMatchesHasMatchKey( keyName ) {
    const hasMatchByKey = await this.getSectionHasMatchPillByKey( element(by.css('sz-entity-details-section.possible')), ('key-' + keyName) );
    return hasMatchByKey;
  }

  async getDisclosedMatchesHasMatchKey( keyName ) {
    const hasMatchByKey = await this.getSectionHasMatchPillByKey( element(by.css('sz-entity-details-section.disclosed')), ('key-' + keyName) );
    // console.log('getDisclosedMatchesHasMatchKey: ', hasMatchByKey, ('key-' + keyName));
    return hasMatchByKey;
  }

  getCollapseableSection( sectionEle ) {
    return sectionEle.all( by.css('.sz-entity-detail-section-collapsible-card-content') ).first();
  }
  getCollapseableSectionHeader( sectionEle ) {
    return sectionEle.all( by.css('.sz-entity-detail-section-collapsible-card-content .mat-expansion-panel-header') ).first();
  }
  getCollapseableSectionHeaderHandle( sectionEle ) {
    return sectionEle.all( by.css('.sz-entity-detail-section-collapsible-card-content .mat-expansion-panel-header svg') ).first();
  }
  async toggleCollapseableSection( sectionStr ) {
    const keysToSelector = {
      'matches': '.details-section.matches',
      'possible': '.details-section.possible',
      'relationships': '.details-section.discovered',
      'disclosed': '.details-section.disclosed'
    };
    const sectionEle = element.all( by.css( keysToSelector[ sectionStr ] )).first();
    const ele = await this.getCollapseableSectionHeader( sectionEle );
    ele.click();
    browser.sleep(1000);
  }

  async sectionIsCollapsed( sectionStr ) {
    const keysToSelector = {
      'matches': '.details-section.matches',
      'possible': '.details-section.possible',
      'relationships': '.details-section.discovered',
      'disclosed': '.details-section.disclosed'
    };
    const sectionEle = await (element.all( by.css( keysToSelector[ sectionStr ] )).first());
    const ele = sectionEle.all( by.css('.sz-entity-detail-section-collapsible-card-content') ).first();
    // console.log('what element is this? ', await sectionEle.getAttribute('class'), ' | ', await ele.getAttribute('class'));
    let eleClasses;
    try {
      eleClasses = (await ele.getAttribute('class')).split(' ');
    } catch (err) {}
    // console.log('classes on section content ele? ', (eleClasses && eleClasses.indexOf('closed') >= 0));
    return (eleClasses && eleClasses.indexOf('closed') >= 0);
    // return EC.presenceOf(collapsedEle);
  }
}
