import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, tap} from 'rxjs/operators';
import {environment} from '@env/environment';
import {Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  constructor(
    private http: HttpClient,
    private core: CoreService
  ) {}

  login(password: string): Observable<object> {
    return this.http.post(
      `${environment.apiEndpoint}/auth/login`,
      { password },
      { observe: 'response', withCredentials: true }
    ).pipe(
      tap(response => {
        const token = response.headers.get('Access-Token');
        if (token) {
          this.core.setToken(token);
        }
      }),
      map(response => {
        return response.body;
      })
    );
  }

  logout(): Observable<string> {
    this.core.setToken(null);
    return this.http.post(
      `${environment.apiEndpoint}/auth/logout`,
      null,
      { responseType: 'text', withCredentials: true }
    );
  }


}
