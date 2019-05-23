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
              <ng-container *ngFor="let season of seasons$ | async">
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
            <app-overview>{{ show.overview }}</app-overview>
            <app-tabs>
              <nav mat-tab-nav-bar>
                <a mat-tab-link
                   [routerLink]="['./', {}]"
                   [active]="isSelectedInfo() | async"
                   queryParamsHandling="preserve">
                  Show Info
                </a>
                <a mat-tab-link
                   *ngFor="let season of seasons$ | async"
                   [routerLink]="['./', {season: season.season_number}]"
                   [active]="isSelectedSeason(season) | async"
                   queryParamsHandling="preserve">
                  Season {{ season.season_number }}
                </a>
              </nav>
            </app-tabs>
            <div class="tabs-content">
              <app-show-info *ngIf="isSelectedInfo() | async" [show]="show"></app-show-info>
              <ng-container *ngFor="let season of seasons$ | async">
                <app-season [show]="show" [season]="season" *ngIf="isSelectedSeason(season) | async"></app-season>
              </ng-container>
            </div>
          </section>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['../styles/details.scss'],
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowComponent implements OnInit {

  show$: Observable<Show>;
  seasons$: Observable<Season[]>;

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
    this.seasons$ = this.show$.pipe(
      filter(show => show.details !== undefined),
      map(show => show.details.seasons.filter(
        season => this.getAvailableEpisodesCount(show, season) > 0
      ))
    );
  }

  isSelectedSeason(season: Season): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('season') !== null && +params.get('season') === season.season_number)
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

  getAvailableEpisodesCount(show: Show, season: Season): number {
    return Array.from(new Set(
      show.files
        .filter(file => file.seasonNumber === season.season_number)
        .map(file => `s${file.seasonNumber}e${file.episodeNumber}`)
    )).length;
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
