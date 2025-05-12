import { Injectable } from '@angular/core';
//import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { filter, share, take } from 'rxjs/operators';
import { SzConsoleConfig, SzWebAppConfigService } from './config.service';
import { SocketIoConfig } from '../common/console-config';

/**
 * Socket wrapper service for socket-io to make it a little easier
 * to handle from the context of an angular app
 **/
@Injectable({
    providedIn: 'root'
})
export class SzXtermSocket {
  subscribersCounter: Record<string, number> = {};
  eventObservables$: Record<string, Observable<any>> = {};

  private _onConnected: Subject<boolean>  = new Subject();
  public onConnected = this._onConnected.asObservable();
  private _onDisconnected: Subject<boolean>  = new Subject();
  public onDisconnected = this._onDisconnected.asObservable();
  private _onOutput: Subject<any>  = new Subject();
  public onOutput = this._onOutput.asObservable();
  private _onError: Subject<any>  = new Subject();
  public onError = this._onError.asObservable();

  private _onReconnected: Subject<number>  = new Subject();
  public onReconnected = this._onReconnected.asObservable();
  private _onReconnectionAttempt: Subject<number>  = new Subject();
  public onReconnectionAttempt = this._onReconnectionAttempt.asObservable();
  private _onReconnectionFailure: Subject<any>  = new Subject();
  public onReconnectionFailure = this._onReconnectionFailure.asObservable();
  private _onReconnectionError: Subject<any>  = new Subject();
  public onReconnectionError = this._onReconnectionError.asObservable();
  private _hasEverSuccessfullyConnected = false;

  /** grab the default socket.io-client default export for socket init */
  private ioFunc = (io as any).default ? (io as any).default : io;
  /** url of the socket.io server */
  private _url: string = '';
  /** getter for url of the socket.io server */
  public set url(value: string) {
      this._url = value;
  }
  /** setter for url of the socket.io server */
  public get url(): string {
      return this._url;
  }
  /** socket config options for the socket.io client */
  private _options: SocketIoConfig["options"]   = {};
  /** setter for socket config options for the socket.io client */
  public set options(value: SocketIoConfig["options"]) {
      this._options = value;
  }
  /** getter for socket config options for the socket.io client */
  public get options(): SocketIoConfig["options"] {
      return this._options;
  }
  /** initialized socket.io socket connection placeholder */
  private _ioSocket: any;
  /** getter for socket.io socket connection instance */
  private get ioSocket(): any {
    return this._ioSocket;
  }
  /** setter for socket.io socket connection instance */
  private set ioSocket(value: any) {
    this._ioSocket = value;
  }

  public get connected(): boolean {
    return this.ioSocket && this.ioSocket.connected !== undefined ? this.ioSocket.connected : false;
  }
  public get disconnected(): boolean {
    return this.ioSocket && this.ioSocket.connected !== undefined ? this.ioSocket.connected : false;
  }

  constructor(private configService: SzWebAppConfigService) {
    // check the config service for console config
    configService.onConsoleConfigChange.pipe(
      filter((cfg) => { return cfg ? true : false; })
    ).subscribe( this.onConfigurationChange.bind(this) );

    this.onConnected.pipe(
      take(1)
    ).subscribe(status => {
      this._hasEverSuccessfullyConnected = true;
    })
  }

  private onConfigurationChange(cfg: SzConsoleConfig) {
    console.warn('SzXtermSocket.onConfigurationChange: ', cfg);
    this.disconnect();
    if(cfg){
      if(cfg.url && cfg.url !== this._url) {
        this._url = cfg.url;
      }
      if(cfg.options && cfg.options !== this._options) {
        this._options = cfg.options;
      }
    }

    this.ioSocket = this.ioFunc(this._url, this._options);

    /** set up socket.io evt to Observable event proxies */
    this.ioSocket.on("output", data => {
      this._onOutput.next(data);
    });
    this.ioSocket.on("connect", data => {
      if(!data) {
        return
      }
      this._onConnected.next(true);
    });
    this.ioSocket.on("disconnect", data => {
      this._onConnected.next(false);
      this._onDisconnected.next(true);
    });
    this.ioSocket.on("error", data => {
      this._onError.next(data);
    });
    this.ioSocket.on("reconnect", (attempt) => {
      this._onReconnected.next(attempt)
    });
    this.ioSocket.on("reconnect_attempt", (attempt) => {
      this._onReconnectionAttempt.next(attempt)
    });
    this.ioSocket.on("reconnect_failed", () => {
      this._onReconnectionFailure.next(true);
    });
    this.ioSocket.on("reconnect_error", (error) => {
      this._onReconnectionError.next(error);
    });
  }
  /**
   * pass through to socket.io-client "of" method
   */
  of(namespace: string) {
    if(!this.ioSocket) { return; }
    this.ioSocket.of(namespace);
  }
  /**
   * pass through to socket.io-client "on" method
   */
  on(eventName: string, callback: Function) {
    if(this.ioSocket && this.ioSocket.on) {
      this.ioSocket.on(eventName, callback);
    }
  }
  /**
   * pass through to socket.io-client "once" method
   */
  once(eventName: string, callback: Function) {
    if(this.ioSocket && this.ioSocket.once) {
      this.ioSocket.once(eventName, callback);
    }
  }
  /**
   * pass through to socket.io-client "connect" method
   */
  connect() {
    return this.ioSocket.connect();
  }
  /**
   * pass through to socket.io-client "connect" method
   */
  reconnect() {
    if(!this._hasEverSuccessfullyConnected) {
      return false
    }
    return this.connect();
  }
  /**
   * pass through to socket.io-client "disconnect" method
   */
  disconnect(_close?: any) {
    if(this.ioSocket && this.ioSocket.disconnect) {
      return this.ioSocket.disconnect.apply(this.ioSocket, arguments);
    }
  }
  /**
   * pass through to socket.io-client "emit" method
   */
  emit(_eventName: string, ..._args: any[]) {
    if(!this.ioSocket) { return; }
    return this.ioSocket.emit.apply(this.ioSocket, arguments);
  }
  /**
   * pass through to socket.io-client "removeListener" method
   */
  removeListener(_eventName: string, _callback?: Function) {
    if(!this.ioSocket) { return; }
    return this.ioSocket.removeListener.apply(this.ioSocket, arguments);
  }
  /**
   * pass through to socket.io-client "removeAllListeners" method
   */
  removeAllListeners(_eventName?: string) {
    if(!this.ioSocket) { return; }
    return this.ioSocket.removeAllListeners.apply(this.ioSocket, arguments);
  }

  fromEvent<T>(eventName: string): Observable<T> {
    if (!this.subscribersCounter[eventName]) {
      this.subscribersCounter[eventName] = 0;
    }
    this.subscribersCounter[eventName]++;

    if (!this.eventObservables$[eventName]) {
      this.eventObservables$[eventName] = new Observable((observer: any) => {
        const listener = (data: T) => {
          observer.next(data);
        };
        this.ioSocket.on(eventName, listener);
        return () => {
          this.subscribersCounter[eventName]--;
          if (this.subscribersCounter[eventName] === 0) {
            this.ioSocket.removeListener(eventName, listener);
            delete this.eventObservables$[eventName];
          }
        };
      }).pipe(share());
    }
    return this.eventObservables$[eventName];
  }

  fromOneTimeEvent<T>(eventName: string): Promise<T> {
    return new Promise<T>(resolve => this.once(eventName, resolve));
  }
}
