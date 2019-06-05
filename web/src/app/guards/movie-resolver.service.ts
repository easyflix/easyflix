import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {Movie} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {catchError, filter, map, shareReplay, switchMap, take} from 'rxjs/operators';
import {MoviesService} from '@app/services/movies.service';
import {HttpClient} from '@angular/common/http';
import {getAPIUrl} from '@app/utils';

@Injectable({
  providedIn: 'root',
})
export class MovieResolverService implements Resolve<Observable<Movie>> {

  constructor(
    private files: FilesService,
    private movies: MoviesService,
    private router: Router,
    private http: HttpClient
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Observable<Movie>> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.movies.getById(+id).pipe(
      map(movie => {
        if (movie === undefined) {
          return this.http.get(getAPIUrl('/api/movies/' + id)).pipe(
            take(1),
            shareReplay(1),
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
