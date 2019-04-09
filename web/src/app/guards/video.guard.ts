import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {VideoService} from '@app/services/video.service';
import {map, take} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Injectable()
export class VideoGuard implements CanActivate {

  constructor(private video: VideoService, private router: Router) {

  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.video.getSource().pipe(
      take(1),
      map(source => !!source || this.router.parseUrl('/home(nav:library)'))
    );
  }
}
