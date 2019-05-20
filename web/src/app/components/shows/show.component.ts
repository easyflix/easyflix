import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Season, Show} from '@app/models/show';
import {DomSanitizer, SafeStyle, SafeUrl} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {VideoService} from '@app/services/video.service';
import {FilesService} from '@app/services/files.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-show',
  template: `
    <ng-container *ngIf="show$ | async as show">
      <div class="container" [style]="getBackdropStyle(show) | async">
        <div class="filter">
          <section class="show">
            <div class="poster">
              <img *ngIf="getShowPosterSource(show) | async as poster"
                   [src]="poster"
                   [class.visible]="isSelectedInfo() | async" alt="Show poster"/>
              <ng-container *ngFor="let season of getSeasons(show)">
                <img *ngIf="getSeasonPosterSource(season) | async as poster"
                     [src]="poster"
                     [class.visible]="isSelectedSeason(season) | async" alt="Season poster"/>
              </ng-container>
            </div>
            <h1 class="title">
              {{ show.name }}
              <span class="year">
                (<a class="search"
                    (click)="searchYear(show.first_air_date.substr(0, 4))">{{ show.first_air_date.substr(0, 4) }}</a>)
              </span>
            </h1>
            <div class="actions">
              <div class="score">
                <mat-progress-spinner mode="determinate"
                                      [value]="show.vote_average * 10"
                                      diameter="60" color="accent">
                </mat-progress-spinner>
                <span>{{ getScore(show) }}%</span>
              </div>
              <span class="user-score">User<br/>Score</span>
              <button class="play" mat-button mat-raised-button color="primary" (click)="play(show)">
                <mat-icon>play_arrow</mat-icon>
                PLAY
              </button>
            </div>
            <p class="overview">
              {{ show.overview }}
            </p>
            <header class="tabs">
              <a class="tab"
                 [routerLink]="['./', {}]"
                 [class.selected]="isSelectedInfo() | async"
                 queryParamsHandling="preserve">
                Show Info
              </a>
              <a class="tab"
                 *ngFor="let season of getSeasons(show)"
                 [routerLink]="['./', {season: season.season_number}]"
                 queryParamsHandling="preserve"
                 [class.selected]="isSelectedSeason(season) | async"
                 [class.hidden]="getAvailableEpisodesCount(show, season) === 0 && !showAll"
                 [class.disabled]="getAvailableEpisodesCount(show, season) === 0">
                Season {{ season.season_number }}
              </a>
              <button mat-icon-button class="settings" [matMenuTriggerFor]="rootMenu" *ngIf="hasEmptySeasons(show)">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #rootMenu="matMenu" xPosition="before" yPosition="below">
                <button mat-menu-item (click)="showAll = !showAll">
                  {{ showAll ? 'Hide unavailable seasons' : 'Show all seasons' }}
                </button>
              </mat-menu>
            </header>
            <div class="tabs-content">
              <app-show-info *ngIf="isSelectedInfo() | async" [show]="show"></app-show-info>
              <ng-container *ngFor="let season of getSeasons(show)">
                <app-season [show]="show" [season]="season" *ngIf="isSelectedSeason(season) | async"></app-season>
              </ng-container>
            </div>
          </section>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .container {
      background-size: cover;
      background-position: 50% 50%;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .container:focus {
      outline: none;
    }
    .filter {
      display: flex;
      flex-direction: column;
      width: 100%;
      flex-grow: 1;
      justify-content: center;
      align-items: center;
    }
    .show {
      display: block;
      box-sizing: border-box;
      max-width: 1360px;
      padding: 60px;
      min-width: 100%;
    }
    @media (min-width: 1360px) {
      .show {
        min-width: 1360px;
      }
    }
    .poster {
      float: left;
      width: 300px;
      min-height: 465px;
      margin-right: 30px;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
    }
    .poster img {
      position: absolute;
      transition: opacity 300ms ease-in-out;
      opacity: 0;
      height: 0;
    }
    .poster img.visible {
      opacity: 1 !important;
      height: unset;
    }
    .title {
      display: flex;
      align-items: center;
      font-size: 3rem;
      margin: 0 0 15px 0;
      font-weight: 500;
      height: 60px;
    }
    .year {
      font-size: 2rem;
      font-weight: 400;
      margin-left: 1rem;
    }
    .actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 60px;
      margin-bottom: 15px;
    }
    .score {
      position: relative;
    }
    .score span {
      position: absolute;
      top: 0;
      left: 0;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-score {
      display: inline-block;
      font-size: 14px;
      font-weight: 500;
      margin-left: 0.5rem;
    }
    .play {
      padding-left: 0.6rem;
      margin-left: 2rem;
    }
    .overview {
      font-weight: 300;
      line-height: 30px;
      margin: 0 0 15px 0;
      max-height: 120px;
      overflow-y: auto;
    }
    .tabs {
      display: flex;
      flex-direction: row;
      margin-bottom: 15px;
      border-bottom: 1px solid;
      position: relative;
      padding-right: 40px;
    }
    .tabs .settings {
      position: absolute;
      right: 0;
    }
    .tab {
      font-weight: 400;
      font-size: 16px;
      width: 8.5rem;
      text-align: center;
      margin: 0 0 -1px 0;
      padding: .75rem 0;
      cursor: pointer;
      text-decoration: none;
    }
    .tab:hover, .tab:focus {
      border-bottom: 2px solid;
    }
    .tab.selected {
      border-bottom: 2px solid;
    }
    .tab.hidden.selected {
      display: unset !important;
    }
    .tabs-content {
      position: relative;
    }
    a.search {
      cursor: pointer;
    }
    a.search:hover {
      text-decoration: underline;
    }
    .hidden {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowComponent implements OnInit {

  show$: Observable<Show>;

  showAll = false;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: FilterService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
    this.show$ = this.route.data.pipe(
      switchMap((data: { show$: Observable<Show> }) => data.show$)
    );
  }

  isSelectedSeason(season: Season): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => +params.get('season') === season.season_number)
    );
  }

  isSelectedInfo(): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('season') === null)
    );
  }

  getShowPosterSource(show: Show): Observable<SafeUrl> {
    if (show.poster) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustResourceUrl(
          `${config.images.secure_base_url}w300${show.poster}`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  getBackdropStyle(show: Show): Observable<SafeStyle> {
    if (show.backdrop) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}original${show.backdrop})`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  getSeasonPosterSource(season: Season) {
    if (season.poster_path) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustResourceUrl(
          `${config.images.secure_base_url}w300${season.poster_path}`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  getScore(show: Show) {
    return Math.floor(show.vote_average * 10);
  }

  getSeasons(show: Show): Season[] {
    return show.details ? show.details.seasons.filter(season => season.season_number !== 0) : [];
  }

  getAvailableEpisodesCount(show: Show, season: Season): number {
    return Array.from(new Set(
      show.files
        .filter(file => file.seasonNumber === season.season_number)
        .map(file => `s${file.seasonNumber}e${file.episodeNumber}`)
    ))/*.map(id =>
      this.show.files.find(file => `s${file.seasonNumber}e${file.episodeNumber}` === id)
    )*/.length;
  }

  hasEmptySeasons(show: Show): boolean {
    return show.details && show.details.seasons.find(
      season => this.getAvailableEpisodesCount(show, season) === 0
    ) !== undefined;
  }

  play(show: Show) {
    // TODO present a dialog to select file to play
    this.files.getByPath(show.files[0].path).subscribe(
      file => this.video.playVideo(file)
    );
  }

  searchYear(year: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setYears([year]);
      }
    );
  }

}
