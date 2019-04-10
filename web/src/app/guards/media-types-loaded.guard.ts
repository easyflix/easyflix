import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {filter, take} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {MediaTypesService} from '@app/services/media-types.service';

@Injectable()
export class MediaTypesLoadedGuard implements CanActivate {

  constructor(private mediaTypes: MediaTypesService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.mediaTypes.getLoaded().pipe(
      filter(f => f),
      take(1)
    );
  }
}
