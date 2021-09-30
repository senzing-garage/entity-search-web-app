import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild, HostBinding } from '@angular/core';
import { SpinnerService } from '../services/spinner.service';
import { UiService } from '../services/ui.service';
import { EntitySearchService } from '../services/entity-search.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import {Overlay } from '@angular/cdk/overlay';
import { AboutInfoService } from '../services/about.service';

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
      return this.isExpanded;
  };
  @HostBinding('class')
  get cssClasses(): string[] {
    let retVal = [];
    if(this.isExpanded) {
      retVal.push('expanded')
    }
    if(this.showSubNav) {
      retVal.push('subnav-expanded')
      // add specifically selected subnav class
      retVal.push('subnav-'+ this.selectedPrimaryNavItem.toLowerCase() +'-visible' );
    }
    return retVal;
  };

  @Input() public isExpanded: boolean = true;
  @Output() public  toggleMenu = new EventEmitter();

  private menuItems = {
    'overview': false,
    'search': true,
    'statistics': false,
    'composition': false,
    'review': false,
    'datasources': false,
    'settings': true,
    'admin': true,
    'license': false
  }

  private selectedPrimaryNavItem: string = 'overview';
  public get showSubNav(): boolean {
    return (this.menuItems[ this.selectedPrimaryNavItem ] && this.menuItems[ this.selectedPrimaryNavItem ] === true)
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

  public selectMenuItem(itemKey: string) {
    this.selectedPrimaryNavItem = itemKey;
  }
}