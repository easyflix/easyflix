import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle, SafeUrl} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {Cast, Crew, MovieDetails} from '@app/models/movie';
import {VideoService} from '@app/services/video.service';
import {FilesService} from '@app/services/files.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-movie',
  template: `
    <ng-container *ngIf="movie$ | async as movie">
      <div class="container" [style]="getBackdropStyle(movie) | async">
        <div class="filter">
          <div class="movie">
            <div class="poster">
              <img [src]="getPosterSource(movie) | async" alt="Movie poster" />
            </div>
            <div class="meta">
              <h1 class="title">
                {{ movie.title }}
                <span class="year">
                  (<a class="search" (click)="searchYear(movie.release_date.substr(0, 4))">{{ movie.release_date.substr(0, 4) }}</a>)
                </span>
              </h1>
              <h2 class="tagline" *ngIf="movie.details as details; else taglineLoading">
                {{ details.tagline ? details.tagline : '&nbsp;' }}
              </h2>
              <ng-template #taglineLoading>
                <h2 class="tagline loading">Loading...</h2>
              </ng-template>
              <div class="actions">
                <div class="score">
                  <mat-progress-spinner mode="determinate"
                                        [value]="movie.vote_average * 10"
                                        diameter="55" color="accent">
                  </mat-progress-spinner>
                  <span>{{ getScore(movie) }}%</span>
                </div>
                <span class="user-score">User Score</span>
                <button class="play" mat-button mat-raised-button color="primary" (click)="play(movie)">
                  <mat-icon>play_arrow</mat-icon>
                  PLAY
                </button>
              </div>
              <p class="overview">
                {{ movie.overview }}
              </p>
              <div class="information">
                <header>
                  <h3 (click)="tabIndex = 0" [class.selected]="tabIndex === 0">Movie Info</h3>
                  <h3 (click)="tabIndex = i + 1" [class.selected]="tabIndex === i + 1" *ngFor="let file of movie.files; index as i">
                    File Info <ng-container *ngIf="movie.files.length > 1">({{ i + 1 }})</ng-container>
                  </h3>
                </header>
                <section class="movie-info" *ngIf="tabIndex === 0">
                  <dl class="left">
                    <dt>Original title</dt>
                    <dd>{{ movie.original_title }}</dd>
                    <dt>Release date</dt>
                    <dd>{{ movie.release_date | date:'mediumDate'}}</dd>
                    <dt>Directed by</dt>
                    <dd *ngIf="movie.details as details; else loading">
                      <ng-container *ngFor="let director of getDirectors(details.credits.crew); last as isLast">
                        <a class="search" (click)="searchPeople(director)">{{director}}</a>{{ isLast ? '' : ', ' }}
                      </ng-container>
                    </dd>
                    <dt>Runtime</dt>
                    <dd *ngIf="movie.details as details; else loading">
                      {{ details.runtime | sgTime }}
                    </dd>
                  </dl>
                  <dl class="right">
                    <dt>Language</dt>
                    <dd>
                      <a class="search" (click)="searchLanguage(movie.original_language)">
                        {{ getLanguage(movie.original_language) | async }}
                      </a>
                    </dd>
                    <dt>Genres</dt>
                    <dd *ngIf="movie.details as details; else loading">
                      <ng-container *ngFor="let genre of getGenre(details); last as isLast">
                        <a class="search" (click)="searchGenre(genre)">{{genre}}</a>{{ isLast ? '' : ', ' }}
                      </ng-container>
                    </dd>
                    <dt>Budget</dt>
                    <dd *ngIf="movie.details as details; else loading">
                      {{ details.budget | currency:'USD':'symbol':'1.0' }}
                    </dd>
                    <dt>Revenue</dt>
                    <dd *ngIf="movie.details as details; else loading">
                      {{ details.revenue | currency:'USD':'symbol':'1.0' }}
                    </dd>
                    <ng-template #loading>
                      <dd class="loading">Loading...</dd>
                    </ng-template>
                  </dl>
                </section>
                <section class="file-info" *ngFor="let file of movie.files; index as i" [class.hidden]="tabIndex !== (i + 1)">
                  <dl>
                    <dt>Library</dt>
                    <dd>{{ file.libraryName }}</dd>
                    <dt>File name</dt>
                    <dd>{{ file.name }}</dd>
                    <dt>File size</dt>
                    <dd>{{ file.size | sgFileSize }}</dd>
                    <dt>Tags</dt>
                    <dd class="tags">
                      <mat-chip-list [selectable]="false" [disabled]="true">
                        <mat-chip *ngFor="let tag of file.tags" (click)="searchTag(tag)">
                          {{ tag }}
                        </mat-chip>
                      </mat-chip-list>
                    </dd>
                  </dl>
                </section>
              </div>
            </div>
            <div class="cast" *ngIf="movie.details as details; else castLoading">
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
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
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
    .movie {
      display: grid;
      max-width: 1300px;
      grid-template-columns: 300px auto;
      grid-template-rows: auto 306px;
      grid-template-areas:
        "poster meta"
        "cast cast";
      justify-items: stretch;
      padding: 2rem;
      box-sizing: border-box;
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
    .tagline {
      margin: 0;
      font-weight: 300;
      font-size: 1.25rem;
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
      min-height: 120px;
    }
    dl.left, dl.right {
      width: 50%;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      margin: .3rem 0;
      text-align: right;
      font-weight: 400;
    }
    dd {
      width: calc(100% - 9rem);
      margin: .3rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .right dt {
      width: 7rem;
    }
    .right dd {
      width: calc(100% - 7rem);
    }
    .tags {
      overflow: visible;
    }
    .tags mat-chip {
      margin-top: 0;
      margin-bottom: 0;
      opacity: 1 !important;
      font-weight: 300;
      cursor: pointer;
    }
    .cast {
      grid-area: cast;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      margin-top: 3rem;
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
export class MovieComponent implements OnInit {

  movie$: Observable<Movie>;

  tabIndex = 0;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: FilterService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
    this.movie$ = this.route.data.pipe(
      switchMap((data: { movie$: Observable<Movie> }) => data.movie$)
    );
  }

  getPosterSource(movie: Movie): Observable<SafeUrl> {
    // TODO: can be null
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustUrl(
        `${config.images.secure_base_url}w300${movie.poster}`
      ))
    );
  }

  getBackdropStyle(movie: Movie): Observable<SafeStyle> {
    // TODO: can be null
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config => this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${config.images.secure_base_url}original${movie.backdrop})`
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

  getScore(movie: Movie) {
    return Math.floor(movie.vote_average * 10);
  }

  getGenre(details: MovieDetails): string[] {
    return details.genres.map(genre => genre.name);
  }

  getDirectors(crew: Crew[]): string[] {
    return crew.map(director => director.name);
  }

  play(movie: Movie) {
    this.files.getByPath(movie.files[0].path).subscribe( // TODO present a dialog to select file to play
      file => this.video.playVideo(file)
    );
  }

  searchYear(year: string) {
    this.router.navigate(['/', {outlets: {movie: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setYears([year]);
      }
    );
  }

  searchLanguage(language: string) {
    this.router.navigate(['/', {outlets: {movie: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setLanguages([language]);
      }
    );
  }

  searchGenre(genre: string) {
    this.router.navigate(['/', {outlets: {movie: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setGenres([genre]);
      }
    );
  }

  searchPeople(person: string) {
    this.router.navigate(['/', {outlets: {movie: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setSearch(person);
      }
    );
  }

  searchTag(tag: string) {
    this.router.navigate(['/', {outlets: {movie: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setTags([tag]);
      }
    );
  }

}
