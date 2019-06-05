import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {LibraryFile} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {catchError, map, switchMap, take} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {getAPIUrl} from '@app/utils';

@Injectable({
  providedIn: 'root',
})
export class VideoResolverService implements Resolve<LibraryFile> {

  constructor(
    private files: FilesService,
    private router: Router,
    private http: HttpClient
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LibraryFile> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.files.getById(id).pipe(
      take(1),
      switchMap((video: LibraryFile) => {
        if (video === undefined) {
          return this.http.get(getAPIUrl('/api/videos/' + encodeURIComponent(id))).pipe(
            map((file: LibraryFile) => { file.id = id; return file; }), // TODO review, setting id is useless now
            catchError(() => { this.router.navigateByUrl('/home(nav:library)'); return EMPTY; })
          );
        } else {
          return of(video);
        }
      })
    );
  }
}
