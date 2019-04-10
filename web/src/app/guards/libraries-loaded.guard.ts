import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {filter, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {FilesService} from '@app/services/files.service';

@Injectable()
export class LibrariesLoadedGuard implements CanActivate {

  constructor(private files: FilesService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.files.getLibrariesLoaded().pipe(
      filter(f => f),
      take(1)
    );
  }
}
