import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitySearchService } from '../services/entity-search.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  /** local setter that sets selected entity at service level */
  public set entityId(value: any) {
    this.search.currentlySelectedEntityId = value;
  }
  /** get the currently selected entity from service level */
  public get entityId(): any {
    return this.search.currentlySelectedEntityId;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private search: EntitySearchService) {
    this.route.params.subscribe( (params) => this.entityId = parseInt(params.entityId, 10) );
  }

  ngOnInit() {}
  /** handler for when the entityId of the sdkcomponent is changed.
   * eg: when a user clicks a related entity name.
  */
  public onEntityIdChanged(entityId: number): void {
    if (this.entityId && this.entityId !== entityId) {
      // update route if needed
      this.router.navigate(['entity/' + entityId]);
    }
  }
}
