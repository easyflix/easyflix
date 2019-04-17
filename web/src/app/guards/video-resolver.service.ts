import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {LibraryFile} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {mergeMap, take} from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class VideoResolverService implements Resolve<LibraryFile> {
  constructor(private files: FilesService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LibraryFile> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.files.getById(id).pipe(
      take(1),
      mergeMap((video: LibraryFile) => {
        if (video === undefined) {
          this.router.navigateByUrl('/home(nav:library)');
          return EMPTY;
        }
        return of(video);
      })
    );
  }
}
