import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {Movie} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {catchError, filter, map, switchMap, take} from 'rxjs/operators';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';
import {MoviesService} from '@app/services/movies.service';

@Injectable({
  providedIn: 'root',
})
export class MovieResolverService implements Resolve<Observable<Movie>> {

  constructor(
    private files: FilesService,
    private movies: MoviesService,
    private router: Router,
    private socketClient: HttpSocketClientService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Observable<Movie>> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.movies.getById(+id).pipe(
      map(movie => {
        if (movie === undefined) {
          return this.socketClient.get('/api/movies/' + id).pipe(
            switchMap((mov: Movie) => concat(
              of(mov),
              this.movies.getById(+id).pipe(filter(m => !!m)))
            ),
            catchError(
              () => {
                this.router.navigate(['/', { outlets: { movie: null } }]); // TODO show 404
                return EMPTY;
              }
            )
          );
        } else {
          return this.movies.getById(+id);
        }
      }),
      take(1)
    );
  }
}
