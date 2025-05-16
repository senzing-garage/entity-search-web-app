import { Component, AfterViewInit } from '@angular/core';
import { SzWebAppConfigService } from '../services/config.service';
import { AboutInfoService } from '../services/about.service';
import { Router } from '@angular/router';

const statTypesToPathParams = {
    MATCHES: 'matches',
    AMBIGUOUS_MATCHES: 'ambiguous',
    POSSIBLE_MATCHES: 'possible-matches',
    POSSIBLE_RELATIONS: 'possible-relations',
    DISCLOSED_RELATIONS: 'disclosed-relations'
}

/**
 * a component to display the datasource summary donut ring,
 * license widget, and venn diagrams.
 *
 * @export
 * @class LandingComponent
 */
@Component({
    selector: 'app-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss'],
    standalone: false
})
export class LandingComponent implements AfterViewInit {

    constructor(private router: Router) {}

    ngAfterViewInit() {}

    /** when user clicks a source stat, change it in the service */
    onSourceStatClicked(evt) {
        console.log(`LandingComponent.onSourceStatClicked: `, evt);
        let _redirectPath = ['sample/'];
        if(evt.dataSource1 && evt.dataSource2 && (evt.dataSource1 !== evt.dataSource2)) {
            _redirectPath.push(evt.dataSource1);
            _redirectPath.push('vs');
            _redirectPath.push(evt.dataSource2);
        } else if(evt.dataSource1) {
            _redirectPath.push(evt.dataSource1);
        } else if(evt.dataSource2) {
            _redirectPath.push(evt.dataSource2);
        }
        if(evt.statType && evt.statType !== undefined && statTypesToPathParams[evt.statType]) {
            _redirectPath.push(statTypesToPathParams[evt.statType]);
        }
        // redirect to sample page
        this.router.navigate(_redirectPath);
    }
}
