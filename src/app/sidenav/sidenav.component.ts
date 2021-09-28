import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ViewChild, HostBinding } from '@angular/core';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SideNavComponent {
    @HostBinding('class.expanded')
    get expandedClass() {
        return this.isExpanded;
    };

    @Input() public isExpanded: boolean = true;
    @Output() public  toggleMenu = new EventEmitter();
}