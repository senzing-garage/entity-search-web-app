import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild, HostBinding } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import {Overlay } from '@angular/cdk/overlay';
import { AboutInfoService } from '../services/about.service';
import { Timer } from 'd3-timer';
import { SzFoliosService, SzPrefsService, SzSearchHistoryFolio, SzSearchHistoryFolioItem } from '@senzing/sdk-components-ng';
import { takeUntil } from 'rxjs/operators';

export interface NavItem {
  key: string;
  name: string;
  order: number;
  submenuItems?: NavItem[],
  default?: boolean
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SideNavComponent {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  
  @HostBinding('class.expanded')
  get expandedClass() {
      return this.primaryExpanded;
  };
  @HostBinding('class')
  get cssClasses(): string[] {
    let retVal = [];
    if(this.primaryExpanded) {
      retVal.push('expanded')
    }
    if(this.showSubNav) {
      retVal.push('subnav-expanded')
      // add specifically selected subnav class
      retVal.push('subnav-'+ this.selectedPrimaryNavItem.key.toLowerCase() +'-visible' );
    }
    if(this.showGraphFilters) {
      retVal.push('graph-open')
    }
    return retVal;
  };

  @Input() public primaryExpanded: boolean = false;
  @Input() public secondaryExpanded: boolean = false;

  @Output() public  onItemHover = new EventEmitter<NavItem>();
  @Output() public  expand = new EventEmitter<NavItem>();

  private menuItems = {
    'overview': {
      name: 'overview',
      key: 'overview',
      order: 0
    },
    'search': {
      name: 'search',
      key: 'search',
      order: 1,
      submenuItems: [
        {
          name: 'By Attribute',
          key: 'search-by-attribute',
          order: 0
        },
        {
          name: 'By Record/Entity Id',
          key: 'search-by-id',
          order: 1
        }
      ]
    },
    'graph': {
      name: 'graph',
      key: 'graph',
      order: 2,
      submenuItems: [
        {
          name: 'Filters',
          key: 'filters',
          order: 0
        },
        {
          name: 'Quick View',
          key: 'quick-view',
          order: 1
        }
      ]
    },
    'statistics': {
      name: 'search',
      key: 'search',
      order: 3
    },
    'composition': {
      name: 'search',
      key: 'search',
      order: 4
    },
    'review': {
      name: 'search',
      key: 'search',
      order: 5
    },
    'datasources': {
      name: 'Data Sources',
      key: 'datasources',
      order: 6,
      submenuItems: [
        {
          name: 'List',
          key: 'datasources-list',
          order: 0
        },
        {
          name: 'Import Data',
          key: 'datasources-import',
          order: 1
        }
      ]
    },
    'settings': {
      name: 'Settings',
      key: 'settings',
      order: 7
      /*submenuItems: [
        {
          name: 'Search',
          key: 'settings-search-results',
          order: 0
        },
        {
          name: 'Entity Resume',
          key: 'settings-entity-resume',
          order: 1
        },
        {
          name: 'Graph',
          key: 'settings-graph',
          order: 2
        }
      ]*/
    },
    'admin': {
      name: 'Admin',
      key: 'admin',
      order: 8
    },
    'license': {
      name: 'License Information',
      key: 'license',
      order: 9
    }
  }

  /** the folio items that holds last "X" searches performed */
  public search_history: SzSearchHistoryFolioItem[];

  private selectedPrimaryNavItem: NavItem = this.getDefaultMenuItem();
  public get showSubNav(): boolean {
    //let showGraphOptions = this.selectedPrimaryNavItem.key === 'graph' && this.uiService.graphOpen;
    //return (this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.submenuItems && this.selectedPrimaryNavItem.submenuItems.length > 0) || showGraphOptions;
    let showGraphOptions = (this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.key === 'graph' && this.showGraphFilters);
    return (showGraphOptions || (this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.submenuItems && this.selectedPrimaryNavItem.submenuItems.length > 0));
    //return false;
  }

  
  public get showGraphFilters(): boolean {
    return this.uiService.graphOpen;
  }
  
  constructor(
    public aboutService: AboutInfoService,
    public overlay: Overlay,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService,
    private titleService: Title,
    public uiService: UiService,
    private prefs: SzPrefsService,
    private foliosService: SzFoliosService
  ) {
    console.log('the fuck? ', this.uiService.graphOpen);
  }

  /**
   * reusable method for getting search history lists deduped, ordered,
   * mapped from "search_history" property
   */
   public getHistoryOptions(fieldName: string): string[] {
    let retVal = [];
    if(this.search_history && this.search_history.map) {
      retVal = this.search_history.filter( (folio: SzSearchHistoryFolioItem) => {
        return folio && folio.data && folio.data[fieldName] && folio.data[fieldName] !== undefined && folio.data[fieldName] !== null;
      }).map( (folio: SzSearchHistoryFolioItem ) => {
        return folio.data[fieldName];
      }).filter(function(elem, index, self) {
        return index == self.indexOf(elem);
      });
    }
    return retVal;
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** when admin is enabled in the poc/api server the "Admin" sub menu is shown */
  public get showAdminOptions(): boolean {
    return this.aboutService.isAdminEnabled;
  }

  private submenuCollapseTimer;

  private getDefaultMenuItem(): NavItem {
    let retValue = this.menuItems[0];
    if(this.menuItems) {
      for(let key in this.menuItems) {
        let menuItem = this.menuItems[ key ];
        if(menuItem.default) {
          retValue = menuItem;
        }
      }
    }
    return retValue;
  }

  public selectMenuItem(itemKey: string) {
    this.selectedPrimaryNavItem = this.menuItems[ itemKey ];
  }
  public onMouseEnterMenuItem(itemKey: string) {
    this.selectedPrimaryNavItem = this.menuItems[ itemKey ];
    this.onItemHover.emit(this.selectedPrimaryNavItem);
  }
  public onMouseLeaveMenuItem(itemKey: string) {
    /*
    this.submenuCollapseTimer = setTimeout(() => {
      this.selectedPrimaryNavItem = undefined
    }, 1000);
    */
  }
  public onMouseEnterSubNav() {
    console.log('onMouseEnterSubNav');
    if(this.submenuCollapseTimer) {
      clearTimeout(this.submenuCollapseTimer);
    }
  }
  public onMouseLeaveSubNav() {
    console.log('onMouseLeaveSubNav');
    this.submenuCollapseTimer = setTimeout(() => {
      this.selectedPrimaryNavItem = undefined
    }, 1000);
  }

  public get showGraphDataSources(): string [] {
    return this.uiService.graphFilterDataSources;
  }
  public onGraphOptionChange(event: {name: string, value: any}) {
    console.log('GraphComponent.onOptionChange: ', event);
    switch(event.name) {
      case 'showLinkLabels':
        //this.showMatchKeys = event.value;
        break;
    }
  }
}