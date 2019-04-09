import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {Video} from '@app/models/file';
import {FilesService} from '@app/services/files.service';
import {mergeMap, take, tap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class VideoResolverService implements Resolve<Video> {
  constructor(private files: FilesService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Video> {
    const id = route.paramMap.get('id');
    return this.files.getFileById(id).pipe(
      take(1),
      mergeMap((video: Video) => {
        return !!video ? of(video) : EMPTY;
      }),
    );
  }
}
