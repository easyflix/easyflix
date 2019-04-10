import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {filter, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {LibrariesService} from '@app/services/libraries.service';

@Injectable()
export class LibrariesLoadedGuard implements CanActivate {

  constructor(private libraries: LibrariesService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.libraries.getLoaded().pipe(
      filter(f => f),
      take(1)
    );
  }
}
