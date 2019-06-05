import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AuthenticationService} from '@app/services/authentication.service';
import {CoreService} from '@app/services/core.service';
import {first, switchMap} from 'rxjs/operators';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService, private core: CoreService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.core.getToken().pipe(
      first(),
      switchMap(token => {
        if (token && !request.url.endsWith('/login')) {
          request = request.clone({
            setHeaders: {
              Authorization: token
            }
          });
        }
        return next.handle(request);
      })
    );
  }
}
