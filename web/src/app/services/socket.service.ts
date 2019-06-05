import {Injectable, OnDestroy} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {getSocketUrl} from '@app/utils';

@Injectable()
export class SocketService implements OnDestroy {

  constructor() {}

  private socketOpened = false;

  socket: WebSocketSubject<SocketMessage> = webSocket({
    url: getSocketUrl(),
    openObserver: {
      next: () => this.socketOpened = true
    },
    closeObserver: {
      next: () => this.socketOpened = false
    }
  });

  get isOpen(): boolean {
    return this.socketOpened;
  }

  observe(type: string): Observable<any> {
    return this.socket.multiplex(
      () => ({ method: 'Subscribe', id: 0, entity: type }),
      () => ({ method: 'Unsubscribe', id: 0, entity: type }),
      message => message.method === type
    ).pipe(map(message => message.entity));
  }

  send(message: SocketMessage): void {
    this.socket.next(message);
  }

  open(): void {
    this.socket.subscribe(); // will complete when close() is called
  }

  close(): void {
    this.socket.complete();
  }

  ngOnDestroy(): void {
    this.socket.complete();
  }

}

export interface SocketMessage {
  id: number;
  method: string;
  entity: any;
}

export interface SocketHttpRequest extends SocketMessage {
  method: string;
  id: number;
  entity: {
    method: string,
    url: string,
    entity?: object
  };
}

export interface SocketHttpResponse extends SocketMessage {
  method: string;
  id: number;
  entity: {
    status: number,
    statusText: string,
    entity: object
  };
}
