import {Injectable} from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {asapScheduler, defer, Observable, scheduled} from 'rxjs';
import {SocketService, SocketHttpRequest, SocketHttpResponse} from '@app/services/socket.service';
import {first, map, mergeMap} from 'rxjs/operators';

@Injectable()
export class SocketInterceptor implements HttpInterceptor {

  private id = 1;

  constructor(private socket: SocketService) { }

  intercept(httpRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.socket.isOpen && !httpRequest.url.includes('/auth/')) {
      const request: SocketHttpRequest = {
        method: 'HttpRequest',
        entity: {
          method: httpRequest.method,
          url: httpRequest.url,
          entity: httpRequest.body || undefined
        },
        id: this.id++
      };
      const expectResponse: Observable<HttpResponse<any>> =
        this.socket.socket.pipe(
          first((r: SocketHttpResponse) => r.method === 'HttpResponse' && r.id === request.id),
          map((r: SocketHttpResponse) => {
            const status = r.entity.status;
            const statusText = r.entity.statusText;
            const entity = r.entity.entity;
            if (status >= 400) {
              throw new HttpErrorResponse({ error: entity, status, statusText, url: httpRequest.url });
            }
            return new HttpResponse({ body: entity, status, statusText, url: httpRequest.url });
          })
        );
      return defer(() => scheduled([this.socket.send(request)], asapScheduler)).pipe(
        mergeMap(() => expectResponse)
      );
    } else {
      return next.handle(httpRequest);
    }
  }
}
