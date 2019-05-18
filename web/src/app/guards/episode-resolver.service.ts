import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {Episode, Show} from '@app/models/show';
import {map, take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EpisodeResolverService implements Resolve<Episode> {

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Episode> | Observable<never> {
    const season = +route.parent.paramMap.get('season');
    const episode = +route.paramMap.get('episode') || 0;
    const showRoute = route.parent.parent;
    const show$ = showRoute.data.show$ as Observable<Show>;
    return show$.pipe(
      map(show => show.episodes
        .filter(ep =>
          ep.season_number === season
        )
        .sort((a, b) => a.episode_number - b.episode_number)
        .filter(ep =>
          episode === 0 || ep.episode_number === episode
        )[0]
      ),
      take(1)
    );
  }

}
