import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {Season, Show} from '@app/models/show';
import {CoreService} from '@app/services/core.service';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {distinctUntilChanged, map, switchMap, take, tap} from 'rxjs/operators';
import {episodesAnimations} from '@app/animations';
import {LibraryFile} from "@app/models";

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
            <dd>{{ season.episode_count }}</dd>
          </dl>
          <p class="overview">{{ season.overview }}</p>
        </div>
      </section>
      <section class="episodes">
        <div class="before">
          <button mat-button (click)="previousEpisode()">
            <mat-icon>arrow_drop_up</mat-icon>
          </button>
        </div>
        <div class="episode" [@episodesAnimation]="getAnimationData(episode) | async">
          <router-outlet #episode="outlet"></router-outlet>
        </div>
        <div class="after">
          <button mat-button (click)="nextEpisode()">
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

  seasonFiles$: Observable<LibraryFile[]>;

  currentEpisodeNumber: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit(): void {
    this.season$ = this.route.paramMap.pipe(
      switchMap(params => {
        const seasonNumber = +params.get('season');
        return this.route.parent.data.pipe(
          switchMap((data: { show$: Observable<Show> }) => data.show$),
          map(show => show.details.seasons.filter(season => season.season_number === seasonNumber)[0])
        );
      })
    );

    this.seasonFiles$ = this.route.paramMap.pipe(
      switchMap(params => {
        const seasonNumber = +params.get('season');
        return this.route.parent.data.pipe(
          switchMap((data: { show$: Observable<Show> }) => data.show$),
          map(show => show.files.filter(file => file.seasonNumber === seasonNumber).sort((a, b) => a.episodeNumber - b.episodeNumber))
        );
      })
    );

    if (this.route.firstChild) {
      this.route.firstChild.paramMap.pipe(
        take(1),
        map(params => params.get('episode')),
        tap(episode => {
          this.currentEpisodeNumber = +episode;
          this.cdr.markForCheck();
        })
      ).subscribe();
    } else {
      this.seasonFiles$.pipe(
        take(1),
        map(files => files[0]),
        tap(file => this.router.navigate([file.episodeNumber], { relativeTo: this.route }).then(
          () => this.route.firstChild.paramMap.pipe(
            take(1),
            map(params => params.get('episode')),
            tap(episode => {
              this.currentEpisodeNumber = +episode;
              this.cdr.markForCheck();
            })
          ).subscribe()
        ))
      ).subscribe();
    }
    // Redirect to first available episode if no child route
    /*if (this.route.firstChild === null) {
      console.log('1')
      this.seasonFiles$.pipe(
        take(1),
        map(files => files[0]),
        tap(file => this.router.navigate([file.episodeNumber], { relativeTo: this.route }))
      ).subscribe();
    } else {
      console.log('2')
      this.route.firstChild.paramMap.pipe(
        switchMap(params => {
          console.log(params)
          const episode = +params.get('episode');
          return this.seasonFiles$.pipe(
            map(files => files.filter(file => file.episodeNumber === episode)[0]) // TODO redirect if unavailable
          );
        }),
        tap(file => {
          this.currentEpisodeNumber = file.episodeNumber;
          this.cdr.markForCheck();
        })
      ).subscribe();
    }*/

  }

  nextEpisode(): void {
    const next = this.currentEpisodeNumber + 1;
    this.seasonFiles$.pipe(
      take(1),
      map(files => files.filter(file => file.episodeNumber === next)[0]),
      tap(file => {
        this.currentEpisodeNumber = next;
        this.router.navigate([file.episodeNumber], { relativeTo: this.route });
      })
    ).subscribe();
  }

  previousEpisode(): void {
    const previous = this.currentEpisodeNumber - 1;
    this.seasonFiles$.pipe(
      take(1),
      map(files => files.filter(file => file.episodeNumber === previous)[0]),
      tap(file => {
        this.currentEpisodeNumber = previous;
        this.router.navigate([file.episodeNumber], { relativeTo: this.route });
      })
    ).subscribe();
  }

  getAnimationData(outlet: RouterOutlet): Observable<string> {
    if (outlet && outlet.isActivated) {
      return outlet.activatedRoute.paramMap.pipe(
        map(params => params.get('episode'))
      );
    } else {
      return of('void');
    }
  }

}
