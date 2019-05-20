import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit} from '@angular/core';
import {Episode, Season, Show} from '@app/models/show';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-season',
  template: `
    <section class="season-info">
      <div>
        <dl>
          <dt>Name</dt>
          <dd>{{ season.name }}</dd>
          <dt>First air date</dt>
          <dd>{{ season.air_date ? (season.air_date | date) : 'N/A' }}</dd>
          <dt>Episodes</dt>
          <dd>
            <span *ngIf="episodes.length < season.episode_count">{{ episodes.length }} /</span>
            {{ season.episode_count }}
          </dd>
        </dl>
        <p class="overview">{{ season.overview }}</p>
      </div>
    </section>
    <section class="episodes">
      <div class="before">
        <button mat-button (click)="previousEpisode()" [disabled]="!hasPreviousEpisode()">
          <mat-icon>arrow_drop_up</mat-icon>
        </button>
      </div>
      <div class="episode-container">
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeasonComponent implements OnInit {

  @Input() show: Show;
  @Input() season: Season;

  episodes: Episode[];

  currentEpisodeIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
  }

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
  }

  hasPreviousEpisode(): boolean {
    return !!this.episodes[this.currentEpisodeIndex - 1];
  }

  hasNextEpisode(): boolean {
    return !!this.episodes[this.currentEpisodeIndex + 1];
  }

  @HostListener('window:keydown.arrowDown')
  goToNext(): void {
    if (this.hasNextEpisode()) {
      this.nextEpisode();
    }
  }

  @HostListener('window:keydown.arrowUp')
  goToPrevious(): void {
    if (this.hasPreviousEpisode()) {
      this.previousEpisode();
    }
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
    this.router.navigate(
      ['./', {
        season: this.season.season_number,
        episode: this.episodes[this.currentEpisodeIndex].episode_number
      }],
      { relativeTo: this.route }
    );
  }

}
