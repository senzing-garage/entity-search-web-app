import { AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Terminal } from 'xterm';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { FitAddon } from 'xterm-addon-fit';
import { fromEvent, Observable, Subject, Subscription, takeUntil, take, filter } from 'rxjs';
import { SzXtermSocket } from '../../services/xterm.socket.service';
import { UiService } from '../../services/ui.service';
import { Title } from '@angular/platform-browser';

@Component({
  encapsulation: ViewEncapsulation.ShadowDom,
  selector: 'sz-xterm',
  templateUrl: './xterm.component.html',
  styleUrls: ['./xterm.component.scss']
})
export class XtermComponent implements AfterViewInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  /** observable to watch for window resize events (allows us to debounce)*/
  resizeObservable$: Observable<Event>
  resizeSubscription$: Subscription
  /** if fullscreen max width/height */
  @HostBinding('class.fullscreen') get _isFullScreen() {
    return this.uiService.noDecoration;
  }
  /** native html element for xterm to bind to */
  @ViewChild('myTerminal')
  terminalDiv: ElementRef;
  /** terminal instance */
  public term: Terminal;
  /** is the console component connected to the socket-io server */
  public get isConnected(): boolean {
    return this.socket.connected;
  }
  private _hasEverConnected = false;
  private _reconnecting = false;
  private _reconnectionAttempt = 0;
  public get reconnecting(): boolean {
    return this._reconnecting
  }
  /** console can be popped out of page
   * when it is this flag is "true"
   */
  public get isFullScreen(): boolean {
    return this.uiService.noDecoration;
  }

  /** fit addon responsible for resizing xterm to container size */
  private fitAddon: FitAddon;
  
  constructor(private socket: SzXtermSocket, 
    private titleService: Title,
    private uiService: UiService) {}
  
  ngAfterViewInit(): void {
    console.log('XtermComponent.ngAfterViewInit');    
    // initialize terminal
    this.initializeTerminal();

    // watch for window resizing
    this.resizeObservable$    = fromEvent(window, 'resize');
    this.resizeSubscription$  = this.resizeObservable$.pipe(
      takeUntil(this.unsubscribe$),
      /*debounce((i: any) => interval(100))*/
    ).subscribe( evt => {
      console.log('terminal resized: ', evt);
      this.fitAddon.fit();
    });

    if(this.isFullScreen) {
      this.titleService.setTitle('Senzing EDA Tools Web Console');
    }
  }
  private initializeTerminal() {
    if(this.term) {
      return;
    }
    console.log('XtermComponent.initializeTerminal');    

    // new terminal
    this.term = new Terminal({
      cursorBlink: true
    });
    // add-ons
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    // bind terminal to HTML node
    this.term.open(this.terminalDiv.nativeElement);

    // fit to host container size
    this.fitAddon.fit();

    // welcome message
    if(this.socket.connected) {
      this._reconnecting = false;
      this._reconnectionAttempt = 0;

      this.term.clear();
      //this.term.writeln('Welcome to senzing eda-tools console');
      this.term.writeln('');
      this.socket.emit("input", String.fromCharCode(13));
    } else {
      //this.term.writeln('Connecting to console..');
    }
    this.term.focus();

    // when the user types or interacts with UI send to socket
    this.term.onData((data) => {
      this.socket.emit("input", data);
    });
    // when the server socket sends output data write to UI
    this.socket.onOutput.subscribe(data => {
      this.term.write(data);
    });
    this.socket.onReconnectionAttempt.subscribe((attempt) => {
      // what to do on reconnection
      this._reconnecting = true;
      this._reconnectionAttempt = attempt;
    });
    this.socket.onReconnected.subscribe((attempt) => {
      // what to do on successful reconnection
      console.log('XtermComponent.onReconnected: ', attempt);
      this._reconnecting = false;
      this._reconnectionAttempt = 0;
    });
    this.socket.onReconnectionFailure.subscribe((error) => {
      // what to do on successful reconnection
      console.warn('XtermComponent.onReconnectionFailure: ', error);
    });
    this.socket.onReconnectionError.subscribe((error) => {
      // what to do on successful reconnection
      console.warn('XtermComponent.onReconnectionError: ', error);
    });
    
    this.socket.onDisconnected.subscribe(isDisconnected => {
      console.warn('socket not connected..');
    });
    this.socket.onConnected.pipe(
      filter(isConnected => { return isConnected}),
      take(1)
    ).subscribe(data => {
      this._hasEverConnected = true;
      this._reconnecting = false;
      this._reconnectionAttempt = 0;
      this.term.clear();
      this.term.writeln('');
      //this.term.writeln('Welcome to senzing eda-tools console');
    });

    this.socket.onConnected.pipe(
      filter(isConnected => { return isConnected})
    ).subscribe(data => {
      this._hasEverConnected = true;
      this._reconnecting = false;
      this._reconnectionAttempt = 0;
      //console.warn('socket connected..', data);
    });

    if(this.socket.disconnected){
      // attempt to reconnect
      this.socket.reconnect();
    }
  }
  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  /** resize the console interface */
  fit() {
    if(this.fitAddon && this.fitAddon.fit) {
      this.fitAddon.fit();
    }
  }
  /** do a quick disconnect and reconnect */
  refresh() {
    this.socket.disconnect();
    this.socket.reconnect();
  }
  /** pass disconnect through to socket-io */
  disconnect() {
    this.socket.disconnect();
  }
}
