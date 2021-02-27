import { Injectable } from '@angular/core';
import { CompletionObserver, Observable, PartialObserver, Subject } from 'rxjs';
import { take, takeUntil, filter, map, tap } from 'rxjs/operators';
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
  private status$: Subject<boolean> = new Subject<boolean>();
  /** observable published to when the state of connection changes */
  private statusChange: Observable<boolean> = this.status$.asObservable();

  /** subject used for when messages sent by server */
  private message$: Subject<any> = new Subject<any>();
  /** observable published when server sends message */
  private messageRecieved: Observable<any> = this.message$.asObservable();

  /** messages sent while connection offline */
  //private _offlineMessageQueue = [];
  private _offlineMessageQueue: offlineMessage[] = [];

  /** instance of AdminStreamConnProperties used for connection instantiation and behavior */
  public connectionProperties: AdminStreamConnProperties = {
    "hostname": 'localhost:8555',
    "connected": false,
    "sampleSize": 1000,
    "connectionTest": false,
    "reconnectOnClose": false
  };

  /** web socket subject used for connection */
  private ws$: WebSocketSubject<any>;

  /** send message to socket */
  public sendMessage(message: string): Observable<boolean> {
    let retSub = new Subject<boolean>();
    let retObs = retSub.asObservable();
    if(this.connectionProperties && !this.connectionProperties.connected) {
      //console.log('queueing message..', this._offlineMessageQueue.length);
      this._offlineMessageQueue.push({data: message, onSent: () => {
        //console.log('[success] sent message.. ', message);
        retSub.next(true);
      }});
    } else {
      //console.log('sending message..', message);
      this.ws$.pipe(
        take(1)
      ).subscribe((res) => {
        // does message match
        retSub.next(true); // for now just pub true
        //retSub.unsubscribe();
        //retSub.complete();
      });
      this.ws$.next(message);
    }
    return retObs;
  }

  constructor() {  
    /** track the connection status of the socket */
    this.statusChange.subscribe((res) => {
      this.connectionProperties.connected = res;
      //console.warn('WebSocketService.statusChange 1: ', res);
    });
    /** when "reconnectOnClose" == true, reconnect socket */
    this.statusChange.pipe(
      filter( (_status) => { return this.connectionProperties.reconnectOnClose && !_status; })
    ).subscribe( this._onDisconnectRetry.bind(this) );
    /** if messages were sent while connection offline send them on reconnection */
    this.statusChange.pipe(
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
      "sampleSize": 1000,
      "connectionTest": false,
      "reconnectOnClose": true
    }
    // set hostname if passed in
    this.connectionProperties.hostname = hostname ? hostname : this.connectionProperties.hostname;
    if(port) { this.connectionProperties.port = port; } 
    // connection string
    let _wsaddr = `ws://${this.connectionProperties.hostname}`;
    _wsaddr += port ? `:${this.connectionProperties.port}`: '';

    // when connection is opened proxy to status$
    const openSubject = new Subject<Event>();
    openSubject.pipe(
      tap( s => console.log('WebSocketService.open: ', s) ),
      map(_ => true),
    ).subscribe(this.status$);
    // when connection is closed proxy to status$
    const closeSubject = new Subject<CloseEvent>();
    closeSubject.pipe(
      tap( s => console.log('WebSocketService.close: ', s) ),
      map(_ => false)
    ).subscribe(this.status$);
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
      takeUntil(this.unsubscribe$)
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

  public close() {
    console.warn('WebSocketService.close: ', this.ws$);
    /*
    if(this.ws$) {
      if(this.ws$.complete) this.ws$.complete();
      if(this.ws$.unsubscribe) this.ws$.unsubscribe();
      this.ws$ = undefined;
    }
    this.connectionProperties.connected = false;
    */
  }
  /** reconnect to previously closed connection */
  public reconnect(){
    console.log('WebSocketService.reconnect: ', this.ws$, this.connectionProperties);
    if(this.ws$) {
      this.ws$.subscribe()
    } else if(this.connectionProperties && this.connectionProperties.connectionTest) {
      this.open();
    } else {
      // should we try to connect something that hasnt been flagged as valid?
      this._onErrorSubject.next('Stream Connection not set properly. please correct and try again.');
    }
  }
  /**
   * when autoreconnect set to true reconnect
   * @param connStatus 
   */
  private _onDisconnectRetry(connStatus){
    console.log('WebSocketService._onDisconnectRetry: ', connStatus, this.connectionProperties, this);
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
      let _wsaddr = `ws://${connectionProps.hostname}`;
      _wsaddr += connectionProps.port ? `:${connectionProps.port}`: '';

      const openSubject = new Subject<Event>();
      openSubject.pipe(
        map(_ => true),
      ).subscribe(this.status$);
      
      const closeSubject = new Subject<CloseEvent>();
      closeSubject.pipe(
        map(_ => false),
      ).subscribe(this.status$);

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
            //console.log('say wha? ', value);
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
      this.ws$.pipe(
        take(1),
      ).subscribe( (res) => {
        connectionProps.connected = true;
        if(res && res.uuid) {
          retSub.next(true);
          retSub.closed = true;
          retSub.unsubscribe();
          this.ws$.complete();
        }
      }, (err)=> {
        connectionProps.connected = false;
        retSub.next(false);
        retSub.closed = true;
        retSub.unsubscribe();
        this.ws$.complete();
      })

    } else {
      connectionProps.connected = false;
      retSub.next(false);
      retSub.closed = true;
      retSub.unsubscribe();
    }

    return retVal;
  }
}