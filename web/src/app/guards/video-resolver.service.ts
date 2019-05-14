import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {LibraryFile} from '@app/models';
import {FilesService} from '@app/services/files.service';
import {catchError, map, switchMap, take} from 'rxjs/operators';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';

@Injectable({
  providedIn: 'root',
})
export class VideoResolverService implements Resolve<LibraryFile> {
  constructor(private files: FilesService, private router: Router, private socketClient: HttpSocketClientService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LibraryFile> | Observable<never> {
    const id = route.paramMap.get('id');
    return this.files.getById(id).pipe(
      take(1),
      switchMap((video: LibraryFile) => {
        if (video === undefined) {
          return this.socketClient.get('/api/videos/' + encodeURIComponent(id)).pipe(
            map((file: LibraryFile) => { file.id = id; return file; }),
            catchError(() => { this.router.navigateByUrl('/home(nav:library)'); return EMPTY; })
          );
        } else {
          return of(video);
        }
      })
    );
  }
}
