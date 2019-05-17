import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Creator, Network, Season, Show, ShowDetails} from '@app/models/show';
import {DomSanitizer, SafeStyle, SafeUrl} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {Cast} from '@app/models/movie';
import {VideoService} from '@app/services/video.service';
import {FilesService} from '@app/services/files.service';
import {FilterService} from '@app/services/filter.service';
import {Router} from '@angular/router';
import {ThemePalette} from '@angular/material';

@Component({
  selector: 'app-show',
  template: `
    <div class="container" [style]="getBackdropStyle() | async" #container tabindex="0">
      <div class="filter">
        <div class="show">
          <div class="poster">
            <img [src]="getShowPosterSource() | async" *ngIf="tabIndex === 0" />
            <ng-container *ngFor="let season of getSeasons(show); index as i">
              <img [src]="getSeasonPosterSource(season) | async" *ngIf="tabIndex === i + 1" />
            </ng-container>
          </div>
          <div class="meta">
            <h1 class="title">
              {{ show.name }}
              <span class="year">
                (<a class="search" (click)="searchYear(show.first_air_date.substr(0, 4))">{{ show.first_air_date.substr(0, 4) }}</a>)
              </span>
            </h1>
            <div class="actions">
              <div class="score">
                <mat-progress-spinner mode="determinate"
                                      [value]="show.vote_average * 10"
                                      diameter="55" color="accent">
                </mat-progress-spinner>
                <span>{{ getScore() }}%</span>
              </div>
              <span class="user-score">User Score</span>
              <button class="play" mat-button mat-raised-button color="primary" (click)="play()">
                <mat-icon>play_arrow</mat-icon>
                PLAY
              </button>
            </div>
            <p class="overview">
              {{ show.overview }}
            </p>
            <div class="information">
              <header>
                <h3 (click)="tabIndex = 0" [class.selected]="tabIndex === 0">Show Info</h3>
                <h3 (click)="tabIndex = i + 1" [class.selected]="tabIndex === i + 1"
                    *ngFor="let season of getSeasons(show); index as i"
                    [class.hidden]="getAvailableEpisodesCount(season) === 0 && !showAll">
                  <span [matBadge]="getAvailableEpisodesCount(season).toString()"
                        matBadgeOverlap="false"
                        matBadgeSize="medium"
                        [matBadgeColor]="getBadgeColor(season)">
                    Season {{ season.season_number }}
                  </span>
                </h3>
              </header>
              <section class="show-info" *ngIf="tabIndex === 0">
                <dl class="left">
                  <dt>Original name</dt>
                  <dd><span class="overflow-ellipsis">{{ show.original_name }}</span></dd>
                  <dt>First air date</dt>
                  <dd>{{ show.first_air_date | date:'mediumDate'}}</dd>
                  <dt>Created by</dt>
                  <dd *ngIf="show.details as details; else loading">
                    <span class="overflow-ellipsis">
                      <ng-container *ngFor="let creator of getCreatedBy(details.created_by); last as isLast">
                        <a class="search" (click)="searchPeople(creator)">{{creator}}</a>{{ isLast ? '' : ',&nbsp;' }}
                      </ng-container>
                    </span>
                  </dd>
                  <dt>Networks</dt>
                  <dd *ngIf="show.details as details; else loading">
                    <span class="overflow-ellipsis">
                      <ng-container *ngFor="let network of getNetworks(details.networks); last as isLast">
                        <a class="search" (click)="searchNetwork(network)">{{network}}</a>{{ isLast ? '' : ',&nbsp;' }}
                      </ng-container>
                    </span>
                  </dd>
                </dl>
                <dl class="right">
                  <dt>Language</dt>
                  <dd>
                    <a class="search" (click)="searchLanguage(show.original_language)">
                      {{ getLanguage(show.original_language) | async }}
                    </a>
                  </dd>
                  <dt>Genres</dt>
                  <dd *ngIf="show.details as details; else loading">
                    <span class="overflow-ellipsis">
                      <ng-container *ngFor="let genre of getGenres(details); last as isLast">
                        <a class="search" (click)="searchGenre(genre)">{{genre}}</a>{{ isLast ? '' : ',&nbsp;' }}
                      </ng-container>
                    </span>
                  </dd>
                  <dt>Seasons</dt>
                  <dd *ngIf="show.details as details; else loading">
                    <span *ngIf="getAvailableSeasons().length !== details.number_of_seasons">
                      {{ getAvailableSeasons().length }}&nbsp;/&nbsp;
                    </span>
                    <span>{{ details.number_of_seasons }}</span>
                    <mat-checkbox class="show-all"
                                  [(ngModel)]="showAll"
                                  *ngIf="getAvailableSeasons().length !== details.number_of_seasons">
                      Show all
                    </mat-checkbox>
                  </dd>
                  <dt>Episodes</dt>
                  <dd *ngIf="show.details as details; else loading">
                    <span *ngIf="getTotalAvailableEpisodesCount() < details.number_of_episodes">
                      {{ getTotalAvailableEpisodesCount() }}/
                    </span>
                    <span>{{ details.number_of_episodes }}</span>
                  </dd>
                  <ng-template #loading>
                    <dd class="loading">Loading...</dd>
                  </ng-template>
                </dl>
              </section>
              <section class="season" *ngFor="let season of getSeasons(show); index as i"
                       [class.hidden]="tabIndex !== i + 1">
                <p>
                  {{ season.air_date ? season.air_date.substring(0, 4) : '' }} |
                  {{ season.episode_count }} episodes
                </p>
                <p class="overview">{{ season.overview }}</p>
              </section>
            </div>
          </div>
        </div>
        <ng-container *ngIf="tabIndex === 0">
          <div class="cast" *ngIf="show.details as details; else castLoading">
            <div class="people" *ngFor="let actor of details.credits.cast">
              <div class="profile" [style]="getActorStyle(actor) | async">
                <mat-icon *ngIf="!actor.profile_path">person</mat-icon>
              </div>
              <div class="name">
                <a class="search" (click)="searchPeople(actor.name)">{{ actor.name }}</a>
              </div>
            </div>
          </div>
          <ng-template #castLoading>
            <!--TODO -->
          </ng-template>
        </ng-container>
      </div>
    </div>
    <ng-content></ng-content>
  `,
  styles: [`
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
      display: grid;
      grid-template-columns: 300px auto;
      grid-template-rows: auto;
      grid-template-areas: "poster meta";
      justify-items: stretch;
      box-sizing: border-box;
      max-width: 1300px;
      padding: 2rem;
    }
    .poster {
      grid-area: poster;
      min-height: 450px;
      font-size: 0;
    }
    .meta {
      grid-area: meta;
      margin-left: 2rem;
      max-width: 900px;
    }
    .title {
      font-size: 3rem;
      margin: 0 0 .5rem 0;
      font-weight: 500;
    }
    .year {
      font-size: 2rem;
      vertical-align: middle;
      font-weight: 400;
    }
    .actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin: 1.5rem 0;
    }
    .score {
      position: relative;
    }
    .score span {
      position: absolute;
      top: 0;
      left: 0;
      width: 55px;
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-score {
      display: inline-block;
      width: 2.4rem;
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
      line-height: 1.5;
      margin: 0
    }
    .information header {
      display: flex;
      flex-direction: row;
      margin: 1rem 0;
      border-bottom: 1px solid;
    }
    .information h3 {
      font-weight: 400;
      font-size: 16px;
      width: 8.5rem;
      text-align: center;
      margin: 0 0 -1px 0;
      padding: .75rem 0;
      cursor: pointer;
    }
    .information h3 .mat-badge-content {
      display: none;
    }
    .information h3:hover .mat-badge-content {
      display: unset;
    }
    .information h3.selected {
      border-bottom: 2px solid;
    }
    dl {
      display: inline-flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      width: 100%;
    }
    dl.left, dl.right {
      width: 50%;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      height: 28px;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin: 0;
    }
    dd {
      width: calc(100% - 9rem);
      height: 28px;
      display: flex;
      align-items: center;
      margin: 0;
    }
    .overflow-ellipsis {
      white-space: nowrap;
      max-width: 100%;
      overflow-x: hidden;
      overflow-y: visible;
      text-overflow: ellipsis;
    }
    .right dt {
      width: 7rem;
    }
    .right dd {
      width: calc(100% - 7rem);
    }
    .show-all {
      margin-left: 1rem;
    }
    .season img {
      float: left;
      width: 120px;
      margin-right: 1rem;
    }
    .cast {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      max-width: 1300px;
      width: 100%;
      height: 258px;
      box-sizing: border-box;
      padding: 0 2rem 2rem 2rem;
    }
    .people {
      display: flex;
      flex-direction: column;
      width: 140px; /* 185 */
    }
    .profile {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 210px; /* 278 */
      background-size: cover;
      background-position: 50% 50%;
    }
    .profile mat-icon {
      font-size: 6rem;
      height: 6rem;
      width: 6rem;
    }
    .name {
      font-weight: 400;
      font-size: 14px;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 0 .5rem;
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

  @Input() show: Show;

  @Input() focusOnLoad = false;

  tabIndex = 0;
  showAll = false;

  @ViewChild('container', {static: true}) container: ElementRef;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: FilterService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
    if (this.focusOnLoad) {
      this.focus();
    }
  }

  getShowPosterSource(): Observable<SafeUrl> {
    // TODO poster can be null
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustResourceUrl(
        `${config.images.secure_base_url}w300${this.show.poster}`
      ))
    );
  }

  getBackdropStyle(): Observable<SafeStyle> {
    // TODO: backdrop can be null
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${config.images.secure_base_url}original${this.show.backdrop})`
      ))
    );
  }

  getSeasonPosterSource(season: Season) {
    // TODO: poster path can be empty
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustResourceUrl(
        `${config.images.secure_base_url}w300${season.poster_path}`
      ))
    );
  }

  getActorStyle(actor: Cast): Observable<SafeStyle> {
    if (actor.profile_path) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w185${actor.profile_path})`
        ))
      );
    }
    return EMPTY;
  }

  getLanguage(languageCode: string): Observable<string> {
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config =>
        config.languages
          .find(language => language.iso_639_1 === languageCode)
          .english_name
      )
    );
  }

  getScore() {
    return Math.floor(this.show.vote_average * 10);
  }

  getGenres(details: ShowDetails): string[] {
    return details.genres.map(genre => genre.name);
  }

  getCreatedBy(creators: Creator[]): string[] {
    return creators.map(creator => creator.name);
  }

  getSeasons(show: Show): Season[] {
    return show.details ? show.details.seasons.filter(season => season.season_number !== 0) : [];
  }

  getNetworks(networks: Network[]): string[] {
    return networks.map(network => network.name);
  }

  getAvailableEpisodesCount(season: Season): number {
    return Array.from(new Set(
      this.show.files
        .filter(file => file.seasonNumber === season.season_number)
        .map(file => `s${file.seasonNumber}e${file.episodeNumber}`)
    )).map(id =>
      this.show.files.find(file => `s${file.seasonNumber}e${file.episodeNumber}` === id)
    ).length;
  }

  getTotalAvailableEpisodesCount(): number {
    return Array.from(
      new Set(this.show.files.map(file => `s${file.seasonNumber}e${file.episodeNumber}`))
    ).length;
  }

  getAvailableSeasons(): Season[] {
    const seasonNumbers = Array.from(new Set(this.show.files.map(file => file.seasonNumber)));
    return this.show.details.seasons.filter(season => seasonNumbers.includes(season.season_number));
  }

  getBadgeColor(season: Season): ThemePalette {
    return this.getAvailableEpisodesCount(season) >= season.episode_count ? 'primary' :
      this.getAvailableEpisodesCount(season) === 0 ? 'warn' : 'accent';
  }

  play() {
    // TODO present a dialog to select file to play
    this.files.getByPath(this.show.files[0].path).subscribe(
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

  searchLanguage(language: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setLanguages([language]);
      }
    );
  }

  searchGenre(genre: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setGenres([genre]);
      }
    );
  }

  searchPeople(person: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setSearch(person);
      }
    );
  }

  searchTag(tag: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setTags([tag]);
      }
    );
  }

  searchNetwork(network: string) {
  }

  focus() {
    this.container.nativeElement.focus();
  }

}
