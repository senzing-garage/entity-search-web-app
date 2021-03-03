import { Injectable } from '@angular/core';
import { BehaviorSubject, CompletionObserver, Observable, of, PartialObserver, Subject } from 'rxjs';
import { take, takeUntil, filter, map, tap, catchError, takeWhile } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
//import { v4 as uuidv4 } from 'uuid';
import { AdminStreamConnProperties } from '@senzing/sdk-components-ng';

interface offlineMessage {
  data: any,
  onSent?: any
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  public unsubscribe$ = new Subject<void>();
  /** when an error occurs it is sent to this subject */
  private _onErrorSubject = new Subject<any>();
  /** subscribe to this observable channel for error notification */
  public onError = this._onErrorSubject.asObservable();
  /** subject used to listen to connection status */
  private _onStatusChange: Subject<CloseEvent | Event> = new BehaviorSubject<CloseEvent | Event>(new CloseEvent('close'));
  /** observable published to when the state of connection changes. Raw Observable<CloseEvent | Event> from rxJS websocket stream */
  public onStatusChange: Observable<CloseEvent | Event> = this._onStatusChange.asObservable();
  /** when a the socket has been opened, reopened, or closed. returns true for connected, false for disconnected */
  public onConnectionStateChange: Observable<boolean> = this.onStatusChange.pipe(
    map( WebSocketService.statusChangeEvtToConnectionBool )
  )

  /** subject used for when messages sent by server */
  private message$: Subject<any> = new Subject<any>();
  /** observable published when server sends message */
  private messageRecieved: Observable<any> = this.message$.asObservable();

  /** messages sent while connection offline */
  private _offlineMessageQueue: offlineMessage[] = [];
  /** the amount of times to retry opening the socket connection if a disconnect happens */
  private _reconnectionAttemptsIncrement = 0;
  /** @internal */
  private _connected = false;
  /** 
   * returns true if the socket is currently open. false if disconnected 
   * @readonly
   **/
  public get connected(): boolean {
    return this._connected;
  }
  /** 
   * when a user manually(calls this.disconnect) this flag is set. this informs
   * the auto-reconnect mechanism NOT to attempt reconnect
   */
  private manuallyDisconnected = false;

  /** instance of AdminStreamConnProperties used for connection instantiation and behavior */
  public connectionProperties: AdminStreamConnProperties = {
    "hostname": 'localhost:8555',
    "connected": false,
    "connectionTest": false,
    "reconnectOnClose": false,
    "reconnectConsecutiveAttemptLimit": 10
  };

  static statusChangeEvtToConnectionBool(status: CloseEvent | Event) {
    let retVal = false;
    if(status){
      if((status as Event).type === 'open') {
        retVal = true;
      } else if((status as CloseEvent).type === 'close') {
        retVal = false;
      }
    }
    return retVal;
  }

  static getSocketUriFromConnectionObject(connProps: AdminStreamConnProperties): string {
    let retVal = "ws://localhost:8955";
    if(connProps) {
      retVal  = (connProps.secure) ? "wss://" : "ws://";
      retVal += (connProps.hostname) ? connProps.hostname : 'localhost';
      retVal += (connProps.port) ? ':'+connProps.port : '';
    }

    return retVal;
  }

  /** web socket subject used for connection */
  private ws$: WebSocketSubject<any>;

  /** send message to socket */
  public sendMessage(message: string): Observable<boolean> {
    let retSub = new Subject<boolean>();
    let retObs = retSub.asObservable();
    if((this.connectionProperties && !this._connected) || this.ws$ === undefined) {
      //console.log('queueing message..', this._offlineMessageQueue.length, this._connected, this.ws$.closed);
      this._offlineMessageQueue.push({data: message, onSent: () => {
        //console.log('[success] sent message.. ', message);
        retSub.next(true);
      }});
    } else if(this.ws$) {
      //console.log('sending message..', message, this._connected);
      this.ws$.pipe(
        take(1)
      ).subscribe((res) => {
        // does message match
        retSub.next(true); // for now just pub true
        //retSub.unsubscribe();
        //retSub.complete();
      });
      this.ws$.next(message);
    } else {
      console.warn('catastrophic premise. no ws$ object or not enough info to create one..');
    }
    return retObs;
  }

  constructor() {  
    /** track the connection status of the socket */
    this.onConnectionStateChange.subscribe((connected) => {
      if(!this._connected && connected) {
        // clear out any reconnect attempt increment
        console.warn(`cleared out reconnection increment number: was(${this._reconnectionAttemptsIncrement}) now(0)`);
        this._reconnectionAttemptsIncrement = 0;
      }
      this._connected = connected;
      console.warn('WebSocketService.onConnectionStateChange: ', this._connected);
    });
    
    /** when "reconnectOnClose" == true, reconnect socket */
    /*
    this.onStatusChange.pipe(
      map( WebSocketService.statusChangeEvtToConnectionBool ),
      filter( (_status) => { return this.connectionProperties.reconnectOnClose && this._reconnectionAttemptsIncrement <= this.connectionProperties.reconnectConsecutiveAttemptLimit && !_status; })
    ).subscribe( this._onDisconnectRetry.bind(this) );
    */
    this.onStatusChange.pipe(
      map( WebSocketService.statusChangeEvtToConnectionBool ),
      filter( (_status) => { 
        return this.connectionProperties.reconnectOnClose && !this.manuallyDisconnected && 
        this._reconnectionAttemptsIncrement < this.connectionProperties.reconnectConsecutiveAttemptLimit && 
        !_status;
      })
    ).subscribe( this._onDisconnectRetry.bind(this) );
    /** if messages were sent while connection offline send them on reconnection */
    this.onConnectionStateChange.pipe(
      filter( _status => _status === true)
    ).subscribe( this._onConnectProcessOfflineMessages.bind(this) );
  }
  /**
   * process any messages sent while socket not open
   * @internal
   */
  private _onConnectProcessOfflineMessages(){
    console.log('WebSocketService._onConnectProcessOfflineMessages: ', this._offlineMessageQueue);

    if(this._offlineMessageQueue && this._offlineMessageQueue.length > 0) {
      this._offlineMessageQueue = this._offlineMessageQueue.filter( (msg, _ind) => {
        this.ws$.pipe(
          take(1)
        ).subscribe((msg.onSent ? msg.onSent : () => {}));
        this.ws$.next(msg.data);
        return false;
      });
    }
  }
  /** open connection */
  public open(hostname?: string, port?: number): Observable<any> {
    // set up intial connection properties if not already set up
    this.connectionProperties = this.connectionProperties ? this.connectionProperties : {
      "hostname": hostname,
      "connected": false,
      "connectionTest": false,
      "reconnectOnClose": true,
      "reconnectConsecutiveAttemptLimit": 10
    }
    // set hostname if passed in
    this.connectionProperties.hostname = hostname ? hostname : this.connectionProperties.hostname;
    if(port) { this.connectionProperties.port = port; } 
    // connection string
    let _wsaddr = WebSocketService.getSocketUriFromConnectionObject(this.connectionProperties);

    // when connection is opened proxy to status$
    const openSubject = new Subject<Event>();
    openSubject.pipe(
      tap( s => { 
        console.log('WebSocketService.open: ', s);
        this._connected = true;
      })
    ).subscribe(this._onStatusChange);
    // when connection is closed proxy to status$
    const closeSubject = new Subject<CloseEvent>();
    closeSubject.pipe(
      tap( s => {
        console.log('WebSocketService.close: ', s);
        this._connected = false;
      })
    ).subscribe(this._onStatusChange);
    const errorSubject = new Subject<CloseEvent>();
    errorSubject.pipe(
      tap( s => console.log('WebSocketService.error: ', s) ),
    ).subscribe(this._onErrorSubject);

    // when message is received proxy to status$
    const messageSubject = new Subject<Event>();
    messageSubject.pipe(
      tap( s => console.log('WebSocketService.message: ', s) ),
      map(_ => false)
    ).subscribe(this.message$);
    // initialize connection
    this.ws$ = webSocket({
      url: _wsaddr,
      deserializer: (value) => {
        if(value && value.data) {
          try{
            var retVal = JSON.parse(value.data.trim());
            //console.log('parsed..', value.data);
            return retVal;
          }catch(err) {
            //console.log('nooooooooooop', '"'+ value.data +'"', value.data, err);
            return value.data;
          }
        } else {
          //console.log('say wha? ', value);
          return value;
        }
      },
      serializer: (value) => {
        if(value && value.data) {
          return value.data;
        }
        return value;
      },
      openObserver: openSubject,
      closeObserver: closeSubject
    });
    // do initial subscription otherwise conn will close
    this.ws$.pipe(
      takeUntil(this.unsubscribe$),
      catchError( (errors: any) => {
        if(errors && !errors.message) {
          errors.message = "Websocket could not connect to Stream interface. Double check that host is valid and reachable.";
        }
        this._onError(errors);
        return of(errors)
      } ),
      filter( (msg) => {
        return msg && msg.uuid;
      })
    ).subscribe((msg) => {
      console.log('clientId: ', msg);
      if(msg && msg.uuid) {
        this.connectionProperties.clientId = msg.uuid;
        this.connectionProperties.connectionTest = true;
      }
    }, this._onError);

    // return observeable
    return this.ws$.asObservable();
  }

  private close() {
    console.warn('WebSocketService.close: ', this.ws$);
    
    if(this.ws$) {
      if(this.ws$.complete) this.ws$.complete();
      //if(this.ws$.unsubscribe) this.ws$.unsubscribe();
      //this.ws$ = undefined;
    }
  }
  public connect(): Observable<any> {
    this.manuallyDisconnected = false;
    return this.open();
  }
  public disconnect() {
    this.manuallyDisconnected = true;
    this.close();
  }
  /** reconnect to previously closed connection */
  public reconnect(){
    if(this.ws$) {
      console.log('WebSocketService.reconnect: ', this.connectionProperties, this.ws$);
      this.ws$.pipe(
        catchError( (error: Error) => {
          console.log('WebSocketService.reconnect: error: ', error, this.ws$.error.toString());
          if(error && !error.message) {
            error.message = `Could not connect to Stream interface(${WebSocketService.getSocketUriFromConnectionObject(this.connectionProperties)}) after a disconnect. Will continue to retry connection until reconnection attempt limit(${this._reconnectionAttemptsIncrement} / ${this.connectionProperties.reconnectConsecutiveAttemptLimit}) is reached.`;
          } else if(this.ws$ && this.ws$.hasError && this.ws$.error.toString) {
            error.message = this.ws$.error.toString();
          } else {
            error.message = 'Unknown error has occurred during reconnection attempt. Check Developer console for more info.'
          }
          this._onError(error);
          return of(error)
        } ),
        map( WebSocketService.statusChangeEvtToConnectionBool ),
        filter((status: boolean) => {
          return status;
        })
      ).subscribe((reconnected) => {
        //this.status$.next(true);
        this._reconnectionAttemptsIncrement = 0;
        console.log(`(${reconnected} | ${this._reconnectionAttemptsIncrement})!!successfully reconnected to "${WebSocketService.getSocketUriFromConnectionObject(this.connectionProperties)}"`, reconnected);
      })
      
    } else if(this.connectionProperties && this.connectionProperties.connectionTest) {
      console.log('WebSocketService.reconnect -> WebSocketService.open', this.ws$, this.connectionProperties);
      this.open();
    } else {
      // should we try to connect something that hasnt been flagged as valid?
      this._onErrorSubject.next('Websocket could not connect to Stream interface after a disconnect. Will continue to retry connection until reconnection attempt limit is reached.');
    }
  }
  /**
   * when autoreconnect set to true reconnect
   * @param connStatus 
   */
  private _onDisconnectRetry(connStatus){
    this._reconnectionAttemptsIncrement = this._reconnectionAttemptsIncrement +1;
    console.log(`(${this._reconnectionAttemptsIncrement} / ${this.connectionProperties.reconnectConsecutiveAttemptLimit}) WebSocketService._onDisconnectRetry: `, connStatus, this.connectionProperties, this);
    this.reconnect();
  }
  /** on error publish to _onErrorSubject */
  private _onError(err: any) {
    console.warn('WebSocketService._onError: ', err);
    this._onErrorSubject.next( err );
  }
  /** test connection properties */
  public testConnection(connectionProps: AdminStreamConnProperties): Observable<boolean> {
    const retSub = new Subject<boolean>();
    const retVal: Observable<boolean> = retSub.asObservable();

    if(connectionProps) {
      let _wsaddr = WebSocketService.getSocketUriFromConnectionObject(this.connectionProperties);

      const openSubject = new Subject<Event>();
      openSubject.pipe(
        tap( s => { 
          console.log('WebSocketService.open: ', s);
          this._connected = true;
        })
      ).subscribe(this._onStatusChange);
      
      const closeSubject = new Subject<CloseEvent>();
      closeSubject.pipe(
        tap( s => {
          console.log('WebSocketService.close: ', s);
          this._connected = false;
        })
      ).subscribe(this._onStatusChange);

      this.ws$ = webSocket({
        url: _wsaddr,
        deserializer: (value) => {
          if(value && value.data) {
            try{
              var retVal = JSON.parse(value.data.trim());
              return retVal;
            }catch(err) {
              return value.data;
            }
          } else {
            return value;
          }
        },
        serializer: (value: any) => {
          if(value && value.data) {
            return value.data;
          }
          return value;
        },
        openObserver: openSubject,
        closeObserver: closeSubject
      });
      this.ws$
      .pipe(
        take(1),
        catchError( (errors: any) => {
          this._onError(errors);
          return of(errors)
        } )
      ).subscribe( (res) => {
        this._connected = true;
        if(res && res.uuid) {
          retSub.next(true);
          retSub.closed = true;
          retSub.unsubscribe();
          this.ws$.complete();
        }
      }, (err)=> {
        this._connected = false;
        retSub.next(false);
        retSub.closed = true;
        retSub.unsubscribe();
        this.ws$.complete();
      })

    } else {
      this._connected = false;
      retSub.next(false);
      retSub.closed = true;
      retSub.unsubscribe();
    }

    return retVal;
  }
}