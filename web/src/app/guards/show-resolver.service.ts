import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {Show} from '@app/models/show';
import {FilesService} from '@app/services/files.service';
import {catchError, filter, map, shareReplay, switchMap, take} from 'rxjs/operators';
import {ShowsService} from '@app/services/shows.service';
import {HttpClient} from '@angular/common/http';
import {getAPIUrl} from '@app/utils';

@Injectable({
  providedIn: 'root',
})
export class ShowResolverService implements Resolve<Observable<Show>> {

  constructor(
    private files: FilesService,
    private shows: ShowsService,
    private router: Router,
    private http: HttpClient
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Observable<Show>> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.shows.getById(+id).pipe(
      map(show => {
        if (show === undefined) {
          return this.http.get(getAPIUrl('/api/shows/' + id)).pipe(
            take(1),
            shareReplay(1),
            switchMap((mov: Show) => concat(
              of(mov),
              this.shows.getById(+id).pipe(filter(m => !!m)))
            ),
            catchError(
              () => {
                this.router.navigate(['/', { outlets: { show: null } }]); // TODO show 404
                return EMPTY;
              }
            )
          );
        } else {
          return this.shows.getById(+id);
        }
      }),
      take(1)
    );
  }
}
