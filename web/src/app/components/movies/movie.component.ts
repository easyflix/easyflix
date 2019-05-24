import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle, SafeUrl} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {Cast, Crew, MovieDetails} from '@app/models/movie';
import {VideoService} from '@app/services/video.service';
import {FilesService} from '@app/services/files.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
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
                                        diameter="60" color="accent">
                  </mat-progress-spinner>
                  <span>{{ getScore(movie) }}%</span>
                </div>
                <span class="user-score">User Score</span>
                <button class="play" mat-button mat-raised-button color="primary" (click)="play(movie)">
                  <mat-icon>play_arrow</mat-icon>
                  PLAY
                </button>
              </div>
              <app-overview>{{ movie.overview }}</app-overview>
              <app-tabs>
                <nav mat-tab-nav-bar>
                  <a mat-tab-link
                     [routerLink]="['./', {}]"
                     [active]="isSelectedInfo() | async"
                     queryParamsHandling="preserve">
                    Show Info
                  </a>
                  <a mat-tab-link
                     *ngFor="let files of movie.files; index as i"
                     [routerLink]="['./', {file: i + 1}]"
                     [active]="isSelectedFile(i + 1) | async"
                     queryParamsHandling="preserve">
                    File Info <ng-container *ngIf="movie.files.length > 1">({{ i + 1 }})</ng-container>
                  </a>
                </nav>
              </app-tabs>
              <div class="tabs-content">
                <section class="info" *ngIf="isSelectedInfo() | async">
                  <app-dl>
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
                  </app-dl>
                  <app-dl>
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
                  </app-dl>
                </section>
                <ng-container *ngFor="let file of movie.files; index as i">
                  <section class="info" *ngIf="isSelectedFile(i + 1) | async">
                    <app-dl>
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
                    </app-dl>
                  </section>
                </ng-container>
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
              <div class="cast">
                <div class="people" *ngFor="let i of [0,1,2,3,4,5,6]">
                  <div class="profile">
                    <mat-icon>person</mat-icon>
                  </div>
                  <div class="name">
                    <app-loading-bar></app-loading-bar>
                  </div>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: [
    '../styles/details.scss',
    '../styles/cast.scss'
  ],
  styles: [`
    .tagline {
      margin: 0 0 15px 0;
      font-weight: 300;
      font-size: 21px;
    }
    .info {
      display: flex;
    }
    .tags mat-chip {
      opacity: 1 !important;
      font-weight: 300;
      cursor: pointer;
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
    private filters: MovieFiltersService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
    this.movie$ = this.route.data.pipe(
      switchMap((data: { movie$: Observable<Movie> }) => data.movie$)
    );
  }

  isSelectedInfo(): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('file') === null)
    );
  }

  isSelectedFile(index: number): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('file') !== null && +params.get('file') === index)
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
    this.router.navigate(['/', {outlets: {details: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setYears([year]);
      }
    );
  }

  searchLanguage(language: string) {
    this.router.navigate(['/', {outlets: {details: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setLanguages([language]);
      }
    );
  }

  searchGenre(genre: string) {
    this.router.navigate(['/', {outlets: {details: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setGenres([genre]);
      }
    );
  }

  searchPeople(person: string) {
    this.router.navigate(['/', {outlets: {details: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setSearch(person);
      }
    );
  }

  searchTag(tag: string) {
    this.router.navigate(['/', {outlets: {details: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setTags([tag]);
      }
    );
  }

}
