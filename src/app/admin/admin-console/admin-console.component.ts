import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SzXtermSocket } from '../../services/xterm.socket.service';
import { UiService } from '../../services/ui.service';
import { XtermComponent } from '../xterm/xterm.component';

@Component({
  selector: 'admin-console',
  templateUrl: './admin-console.component.html',
  styleUrls: ['./admin-console.component.scss']
})
export class AdminConsoleComponent implements AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** native html element for xterm to bind to */
  @ViewChild('xtermConsole')
  xtermConsole: XtermComponent;

  public get isConnected(): boolean {
    return this.xtermService.connected;
  }

  constructor( public uiService: UiService, private xtermService: SzXtermSocket) {}

  ngAfterViewInit(): void {
    this.uiService.onSearchExpanded.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((isExpanded: boolean) => {
      // call "fit()" in the xterm component when expansion state changes
      console.log('search expansion state changed. calling "xtermConsole.fit()"..');
      this.xtermConsole.fit();
    });
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
