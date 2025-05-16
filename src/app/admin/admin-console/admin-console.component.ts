import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SzXtermSocket } from '../../services/xterm.socket.service';
import { UiService } from '../../services/ui.service';
import { XtermComponent } from '../xterm/xterm.component';

@Component({
    selector: 'admin-console',
    templateUrl: './admin-console.component.html',
    styleUrls: ['./admin-console.component.scss'],
    standalone: false
})
export class AdminConsoleComponent implements AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** native html element for xterm to bind to */
  @ViewChild('xtermConsole')
  xtermConsole: XtermComponent;

  private externalWindow = null;
  private _extConsoleClosedCheckTimer;
  private _externalWindowDefaultWidth = 1280;
  private _externalWindowDefaultHeight  = 768;

  public get isConnected(): boolean {
    return this.xtermService.connected;
  }
  public get isConsolePoppedOut(): boolean {
    return this.uiService.consolePopOutOpen;
  }

  constructor( private xtermService: SzXtermSocket, public uiService: UiService) {}

  ngAfterViewInit(): void {
    this.uiService.onSearchExpanded.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((isExpanded: boolean) => {
      // call "fit()" in the xterm component when expansion state changes
      if(this.xtermConsole && this.xtermConsole.fit) {
        try {
          this.xtermConsole.fit();
        } catch(err){}
      }
    });
  }

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  public toggleConnection() {
    if(this.xtermConsole && this.xtermConsole.refresh) {
      console.log('toggleConnection: ', this.xtermConsole);
      this.xtermConsole.refresh();
    }
  }
  /** pop command window out of page */
  public detachCmdFromPage() {
    if(this.xtermConsole && this.xtermConsole.disconnect) {
      console.log('disconnect socket from console');
      this.xtermConsole.disconnect();
    }

    let _windowOpts = 'width='+ this._externalWindowDefaultWidth +',height='+this._externalWindowDefaultHeight+',left=200,top=200'
    this.externalWindow = window.open('/no-decorator(popup:console)', '_szconsole', _windowOpts);
    this.uiService.consolePopOutOpen = true;
    this._extConsoleClosedCheckTimer = setInterval(() => {
      if(this.externalWindow && this.externalWindow.closed){
        clearInterval(this._extConsoleClosedCheckTimer);
        this.uiService.consolePopOutOpen = false;
        setTimeout(() => {
          if(this.xtermConsole && this.xtermConsole.refresh) {
            try {
              this.xtermConsole.refresh()
            } catch(err){}
          }
        }, 1000);
      }
    })
  }
}
