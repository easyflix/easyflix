import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {EMPTY, Observable, of} from 'rxjs';
import {Episode, Season, Show} from '@app/models/show';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {episodesAnimations} from '@app/animations';

@Component({
  selector: 'app-season',
  template: `
    <ng-container *ngIf="season$ | async as season">
      <section class="season">
        <div>
          <dl>
            <dt>Name</dt>
            <dd>{{ season.name }}</dd>
            <dt>First air date</dt>
            <dd>{{ season.air_date ? (season.air_date | date) : 'N/A' }}</dd>
            <dt>Episodes</dt>
            <dd>
              <ng-container *ngIf="episodes$ | async as episodes">
                <span *ngIf="episodes.length < season.episode_count">{{ episodes.length }} /</span>
              </ng-container>
              {{ season.episode_count }}
            </dd>
          </dl>
          <p class="overview">{{ season.overview }}</p>
        </div>
      </section>
      <section class="episodes">
        <div class="before">
          <button mat-button (click)="previousEpisode()" [disabled]="!(hasPreviousEpisode() | async)">
            <mat-icon>arrow_drop_up</mat-icon>
          </button>
        </div>
        <div class="episode" [@episodesAnimation]="getAnimationData(episode) | async">
          <router-outlet #episode="outlet"></router-outlet>
        </div>
        <div class="after">
          <button mat-button (click)="nextEpisode()" [disabled]="!(hasNextEpisode() | async)">
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
        </div>
      </section>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
    }
    .season{
      display: flex;
      height: 120px;
    }
    dl {
      padding: 0 1rem 0 0;
      float: left;
      width: 380px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      line-height: 1.9;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      font-weight: 400;
      margin: 0;
      text-align: right;
    }
    dd {
      width: calc(100% - 9rem);
      align-items: center;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overview {
      font-weight: 300;
      line-height: 30px;
      margin: 0;
      max-height: 120px;
      overflow-y: auto;
    }
    .episodes {
      display: flex;
      flex-direction: column;
      height: 290px;
      padding-top: 15px;
      box-sizing: border-box;
      width: 100%;
      max-width: 1300px;
      position: relative;
    }
    .episode {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    .before, .after {
      position: absolute;
      display: flex;
      height: 45px;
      align-items: center;
      justify-content: center;
      width: 100%;
      z-index: 1;
    }
    .before {
      top: 15px;
    }
    .after {
      bottom: 0;
    }
    .before button, .after button {
      width: 100%;
      border-radius: 0;
    }
  `],
  animations: [episodesAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeasonComponent implements OnInit {

  season$: Observable<Season>;

  episodes$: Observable<Episode[]>;

  currentEpisodeIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit(): void {
    this.season$ = this.route.data.pipe(
      map((data: { season: Season }) => data.season)
    );

    this.episodes$ = this.route.paramMap.pipe(
      switchMap(params => {
        const seasonNumber = +params.get('season');
        return this.route.parent.data.pipe(
          switchMap((data: { show$: Observable<Show> }) => data.show$),
          map(show =>
            show.episodes
              .filter(episode => episode.season_number === seasonNumber)
              .sort((a, b) => a.episode_number - b.episode_number)
          )
        );
      })
    );

    this.route.firstChild.paramMap.pipe(
      take(1),
      map(params => params.get('episode')),
      switchMap(episode => {
        if (episode === null) {
          return EMPTY;
        }
        return this.episodes$.pipe(
          tap(episodes => {
            const ep = episodes.find(e => e.episode_number === +episode);
            this.currentEpisodeIndex = episodes.indexOf(ep);
            this.cdr.markForCheck();
          })
        );
      })
    ).subscribe();
  }

  hasPreviousEpisode(): Observable<boolean> {
    return this.episodes$.pipe(
      map(episodes => !!episodes[this.currentEpisodeIndex - 1]),
    );
  }

  hasNextEpisode(): Observable<boolean> {
    return this.episodes$.pipe(
      map(episodes => !!episodes[this.currentEpisodeIndex + 1]),
    );
  }

  nextEpisode(): void {
    this.currentEpisodeIndex += 1;
    this.navigateToCurrentEpisode();
  }

  previousEpisode(): void {
    this.currentEpisodeIndex -= 1;
    this.navigateToCurrentEpisode();
  }

  navigateToCurrentEpisode() {
    this.episodes$.pipe(
      map(episodes => episodes[this.currentEpisodeIndex]),
      tap((episode: Episode) =>
        this.router.navigate(['episode', episode.episode_number], { relativeTo: this.route })
      ),
      take(1)
    ).subscribe();
  }

  getAnimationData(outlet: RouterOutlet): Observable<string> {
    if (outlet && outlet.isActivated) {
      return outlet.activatedRoute.paramMap.pipe(
        map(params => params.get('episode') || '0')
      );
    } else {
      return of('void');
    }
  }

}
