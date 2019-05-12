import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {Movie} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {map, switchMap, take} from 'rxjs/operators';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';
import {MoviesService} from '@app/services/movies.service';

@Injectable({
  providedIn: 'root',
})
export class MovieResolverService implements Resolve<Movie> {

  constructor(
    private files: FilesService,
    private movies: MoviesService,
    private router: Router,
    private socketClient: HttpSocketClientService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Movie> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.movies.getById(+id).pipe(
      switchMap(movie => {
        if (movie === undefined) {
          return this.socketClient.get('/api/movies/' + id).pipe(
            map((mov: Movie) => mov)
          );
        } else {
          return of(movie);
        }
      }),
      take(1)
    );
  }
}
