import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { v4 as uuidv4 } from 'uuid';
import { AdminStreamConnProperties } from '../common/stream-conn-dialog/stream-conn-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  public unsubscribe$ = new Subject<void>();

  private _onErrorSubject = new Subject<any>();
  public onError = this._onErrorSubject.asObservable();
  
  private _connected = false;
  private get connected() {
    return this._connected;
  }

  public connectionProperties: AdminStreamConnProperties = {
    "hostname": 'localhost:8255',
    "connected": false,
    "sampleSize": 1000,
    "connectionTest": false
  };

  //private ws$: WebSocketSubject<any> = new WebSocket('ws://localhost:3000');
  private ws$: WebSocketSubject<any>;

  public getWSListener() {
      return this.ws$.asObservable().pipe();
  }

  public sendMessage(message: string) {
      //this.ws$.next({'message': message});
      console.log('sending message: ', message);
      this.ws$.next(message);
  }

  public open(hostname: string, port?: number) {
    this.connectionProperties = this.connectionProperties ? this.connectionProperties : {
      "hostname": hostname,
      "connected": false,
      "sampleSize": 1000,
      "connectionTest": false,
    }
    this.connectionProperties.hostname = hostname;
    if(port) { this.connectionProperties.port = port; } 

    let _wsaddr = `ws://${this.connectionProperties.hostname}`;
    _wsaddr += port ? `:${this.connectionProperties.port}`: '';


    if(this.connectionProperties.connected || this.ws$ !== undefined){
      // disconnect first
      // this.ws$.unsubscribe();
    }
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
      }
    });
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
  public onHeartbeatTick() {
    this.sendMessage(JSON.stringify({"heartbeat": Date.now(), "uuid": this.connectionProperties.clientId}))
  }
  public close() {

    if(this.ws$) {
      if(this.ws$.complete) this.ws$.complete();
      if(this.ws$.unsubscribe) this.ws$.unsubscribe();
      this.ws$ = undefined;
    }
    this.connectionProperties.connected = false;
  }
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
        }
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