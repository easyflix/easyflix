import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Episode, Season, Show} from '@app/models/show';
import {ActivatedRoute, Router} from '@angular/router';
import {animate, group, query, style, transition, trigger} from '@angular/animations';
import {DEFAULT_TIMING} from '@app/animations';
import {KeyboardService} from '@app/services/keyboard.service';
import {Subscription} from 'rxjs';

const isNext = (from, to) => {
  return to.startsWith('next');
};

const isPrev = (from, to) => {
  return to.startsWith('prev');
};

const slideUp = [
  query(':enter, :leave', [
    style({
      position: 'absolute'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translateY(calc(280px))'
    })
  ]),
  group([
    query(
      ':enter',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translateY(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translateY(calc(-280px))' }))
    )
  ])
];

const slideDown = [
  query(':enter, :leave', [
    style({
      position: 'absolute'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translateY(calc(-280px))'
    })
  ]),
  group([
    query(
      ':enter',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translateY(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translateY(calc(280px))' }))
    )
  ])
];

@Component({
  selector: 'app-season',
  template: `
    <section class="season-info">
      <div>
        <app-dl>
          <dt>Name</dt>
          <dd>{{ season.name }}</dd>
          <dt>First air date</dt>
          <dd>{{ season.air_date ? (season.air_date | date) : 'N/A' }}</dd>
          <dt>Episodes</dt>
          <dd>
            <span *ngIf="episodes.length < season.episode_count">{{ episodes.length }} /</span>
            {{ season.episode_count }}
          </dd>
        </app-dl>
        <app-overview>{{ season.overview }}</app-overview>
      </div>
    </section>
    <section class="episodes">
      <div class="before">
        <button mat-button (click)="previousEpisode()" [disabled]="!hasPreviousEpisode()">
          <mat-icon>arrow_drop_up</mat-icon>
        </button>
      </div>
      <div class="episode-container" [@episodeAnimation]="getAnimation()">
        <ng-container *ngFor="let episode of episodes; index as i">
          <app-episode *ngIf="currentEpisodeIndex === i" [show]="show" [episode]="episode"></app-episode>
        </ng-container>
      </div>
      <div class="after">
        <button mat-button (click)="nextEpisode()" [disabled]="!hasNextEpisode()">
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    .season-info {
      display: flex;
      height: 120px;
    }
    app-dl {
      padding: 0 1rem 0 0;
      float: left;
      width: 380px;
      box-sizing: border-box;
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
    .episode-container {
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
      height: 40px;
      width: 100%;
      border-radius: 0;
    }
  `],
  animations: [
    trigger('episodeAnimation', [
      // transition(debugAnimation('episode'), []),
      transition('void => *', []),
      transition(isNext, slideUp),
      transition(isPrev, slideDown),
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeasonComponent implements OnInit, OnDestroy {

  @Input() show: Show;
  @Input() season: Season;

  episodes: Episode[];

  currentEpisodeIndex = 0;

  animateNext = true;

  subscriptions: Subscription[] = [];

  constructor(
    private keyboard: KeyboardService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.episodes = this.show.episodes
      .filter(episode => episode.season_number === this.season.season_number)
      .sort((a, b) => a.episode_number - b.episode_number);

    const currentEpisode = this.route.snapshot.paramMap.get('episode');
    if (currentEpisode !== null) {
      this.currentEpisodeIndex = this.episodes.indexOf(
        this.episodes.find(e => e.episode_number === +currentEpisode)
      );
    }

    // Keyboard events
    this.subscriptions.push(
      this.keyboard.ArrowDown.subscribe(
        () => {
          this.nextEpisode();
          this.cdr.markForCheck();
        }
      ),
      this.keyboard.ArrowUp.subscribe(
        () => {
          this.previousEpisode();
          this.cdr.markForCheck();
        }
      )
    );

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  hasPreviousEpisode(): boolean {
    return !!this.episodes[this.currentEpisodeIndex - 1];
  }

  hasNextEpisode(): boolean {
    return !!this.episodes[this.currentEpisodeIndex + 1];
  }

  nextEpisode(): void {
    if (this.hasNextEpisode()) {
      this.currentEpisodeIndex += 1;
      this.animateNext = true;
      this.navigateToCurrentEpisode();
    }
  }

  previousEpisode(): void {
    if (this.hasPreviousEpisode()) {
      this.currentEpisodeIndex -= 1;
      this.animateNext = false;
      this.navigateToCurrentEpisode();
    }
  }

  navigateToCurrentEpisode() {
    this.router.navigate(
      ['./', {
        season: this.season.season_number,
        episode: this.episodes[this.currentEpisodeIndex].episode_number
      }],
      { relativeTo: this.route }
    );
  }

  getAnimation(): string {
    return (this.animateNext ? 'next-' : 'prev-') + this.currentEpisodeIndex;
  }

}
