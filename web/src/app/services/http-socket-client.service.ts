import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {concat, Observable} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {getAPIUrl, getSocketUrl} from '@app/utils';

@Injectable()
export class HttpSocketClientService implements OnDestroy {

  constructor(private httpClient: HttpClient) { }

  public id = 1;

  private socketOpened = false;

  private preferHttpOverSocket = true;

  socket: WebSocketSubject<SocketMessage> = webSocket({
    url: getSocketUrl(),
    openObserver: {
      next: () => this.socketOpened = true
    },
    closeObserver: {
      next: () => this.socketOpened = false
    }
  });

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

  close(): void {
    this.socket.complete();
  }

  ngOnDestroy(): void {
    this.socket.complete();
  }

  get(path: string): Observable<object> {
    if (this.preferHttpOverSocket || !this.socketOpened) {
      return this.httpClient.get(getAPIUrl(path));
    } else {
      const request: HttpRequest = {
        method: 'HttpRequest',
        entity: {
          method: 'GET',
          url: getAPIUrl(path)
        },
        id: this.id++
      };
      return this.sendRequest(request);
    }
  }

  post(path: string, entity: object): Observable<object> {
    if (this.preferHttpOverSocket || !this.socketOpened) {
      return this.httpClient.post(
        getAPIUrl(path),
        JSON.stringify(entity),
        { headers: {'Content-Type': 'application/json'}}
      );
    } else {
      const request: HttpRequest = {
        method: 'HttpRequest',
        entity: {
          method: 'POST',
          url: getAPIUrl(path),
          entity
        },
        id: this.id++
      };
      return this.sendRequest(request);
    }
  }

  delete(path: string): Observable<object> {
    if (this.preferHttpOverSocket || !this.socketOpened) {
      return this.httpClient.delete(
        getAPIUrl(path)/*,
        { headers: {'Content-Type': 'application/json'}}*/
      );
    } else {
      const request: HttpRequest = {
        method: 'HttpRequest',
        entity: {
          method: 'DELETE',
          url: getAPIUrl(path),
        },
        id: this.id++
      };
      return this.sendRequest(request);
    }
  }


  private sendRequest(request: HttpRequest): Observable<object> {
    const expectResponse =
      this.socket.pipe(
        filter((r: HttpResponse) => r.method === 'HttpResponse' && r.id === request.id),
        map((r: HttpResponse) => {
          const status = r.entity.status;
          const statusText = r.entity.statusText;
          const entity = r.entity.entity;
          if (status >= 400) {
            throw new HttpErrorResponse({error: entity, status, statusText, url: request.entity.url});
          }
          return entity;
        }),
        take(1)
      );
    const sendRequest = new Observable(observer => {
      this.send(request);
      observer.complete();
      return () => {};
    });
    return concat(sendRequest, expectResponse);
  }

}

export interface SocketMessage {
  id: number;
  method: string;
  entity: any;
}

export interface HttpRequest extends SocketMessage {
  method: string;
  id: number;
  entity: {
    method: string,
    url: string,
    entity?: object
  };
}

export interface HttpResponse extends SocketMessage {
  method: string;
  id: number;
  entity: {
    status: number,
    statusText: string,
    entity: object
  };
}
