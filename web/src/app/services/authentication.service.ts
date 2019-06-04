import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {environment} from '@env/environment';
import {Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  constructor(private http: HttpClient) {
  }

  get token(): string {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  login(password: string): Observable<string> {
    return this.http.post<string>(
      `${environment.apiEndpoint}/auth/login`,
      { password },
      { observe: 'response', withCredentials: true }
    ).pipe(
      map(response => {
        const token = response.headers.get('Access-Token');
        if (token) {
          localStorage.setItem('token', token);
        }
        return response.body;
      })
    );
  }

  logout(): Observable<string> {
    localStorage.removeItem('token');
    return this.http.post(
      `${environment.apiEndpoint}/auth/logout`,
      null,
      { responseType: 'text', withCredentials: true }
    );
  }


}
