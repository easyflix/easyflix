import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {Season, Show} from '@app/models/show';
import {map, take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SeasonResolverService implements Resolve<Season> {

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Season> | Observable<never> {
    const season = +route.paramMap.get('season');
    return route.parent.data.show$.pipe(
      map((show: Show) => show.details.seasons.filter(s => s.season_number === season)[0]),
      take(1)
    );
  }

}
