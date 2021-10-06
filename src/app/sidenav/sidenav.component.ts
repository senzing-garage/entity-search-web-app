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
    'statistics': {
      name: 'search',
      key: 'search',
      order: 2
    },
    'composition': {
      name: 'search',
      key: 'search',
      order: 3
    },
    'review': {
      name: 'search',
      key: 'search',
      order: 4
    },
    'datasources': {
      name: 'Data Sources',
      key: 'datasources',
      order: 5,
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
      order: 6
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
      order: 7
    },
    'license': {
      name: 'License Information',
      key: 'license',
      order: 8
    }
  }

  private selectedPrimaryNavItem: NavItem = this.getDefaultMenuItem();
  public get showSubNav(): boolean {
    return (this.selectedPrimaryNavItem && this.selectedPrimaryNavItem.submenuItems && this.selectedPrimaryNavItem.submenuItems.length > 0)
    //return false;
  }
  
  constructor(
    public aboutService: AboutInfoService,
    public overlay: Overlay,
    private router: Router,
    private search: EntitySearchService,
    private spinner: SpinnerService,
    private titleService: Title,
    public uiService: UiService
  ) { }

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
}