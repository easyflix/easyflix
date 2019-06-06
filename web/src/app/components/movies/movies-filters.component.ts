import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';

@Component({
  selector: 'app-movies-filters',
  template: `
    <mat-form-field appearance="standard">
      <mat-label>Search</mat-label>
      <input [formControl]="search" matInput name="movie-search" placeholder="Search in movies" spellcheck="false" />
    </mat-form-field>
    <mat-form-field appearance="standard">
      <mat-label>Genres</mat-label>
      <mat-select multiple [formControl]="genres">
        <mat-option *ngFor="let genre of genres$ | async" [value]="genre">
          {{ genre }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="standard">
      <mat-label>Years</mat-label>
      <mat-select multiple [formControl]="years" placeholder="Year">
        <mat-option *ngFor="let year of years$ | async" [value]="year">
          {{ year }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="standard">
      <mat-label>Languages</mat-label>
      <mat-select multiple [formControl]="languages">
        <mat-option *ngFor="let language of languages$ | async" [value]="language.code">
          {{ language.name }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="standard">
      <mat-label>Tags</mat-label>
      <mat-select multiple [formControl]="tags">
        <mat-option *ngFor="let tag of tags$ | async" [value]="tag">
          {{ tag }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="standard">
      <mat-label>User Score</mat-label>
      <mat-select [formControl]="rating">
        <mat-option>All</mat-option>
        <mat-option *ngFor="let rating of ratings$ | async" [value]="rating">
          Above {{rating}}%
        </mat-option>
      </mat-select>
    </mat-form-field>
    <button mat-raised-button *ngIf="showClear$ | async"
            color="warn" class="clear"
            (click)="clearFilters()">CLEAR</button>
  `,
  styles: [`
     mat-form-field {
       width: 100%;
     }
    .clear {
      margin-top: 2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesFiltersComponent implements OnInit, OnDestroy {

  search = new FormControl();
  rating = new FormControl();
  years = new FormControl();
  languages = new FormControl();
  tags = new FormControl();
  genres = new FormControl();

  ratings$: Observable<number[]>;
  years$: Observable<string[]>;
  languages$: Observable<{ code: string; name: string }[]>;
  tags$: Observable<string[]>;
  genres$: Observable<string[]>;

  showClear$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  constructor(
    private core: CoreService,
    private movies: MoviesService,
    private filters: MovieFiltersService,
  ) {}

  ngOnInit(): void {

    this.showClear$ = this.filters.hasAppliedFilters();

    this.ratings$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          MovieFiltersService.isWithinSearch(movie, filters) &&
          MovieFiltersService.isWithinLanguages(movie, filters) &&
          MovieFiltersService.isWithinYears(movie, filters) &&
          MovieFiltersService.isWithinTags(movie, filters) &&
          MovieFiltersService.isWithinGenres(movie, filters)
        )),
        map(movies => [90, 80, 70, 60, 50].filter(
          rating => movies.some(movie => movie.vote_average * 10 >= rating)
        ))
      ))
    );

    this.years$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          MovieFiltersService.isWithinSearch(movie, filters) &&
          MovieFiltersService.isWithinRating(movie, filters) &&
          MovieFiltersService.isWithinLanguages(movie, filters) &&
          MovieFiltersService.isWithinTags(movie, filters) &&
          MovieFiltersService.isWithinGenres(movie, filters)
        )),
        map(movies => movies.map(movie => movie.release_date.substr(0, 4))),
        map(years => Array.from(new Set(years)).sort().reverse())
      ))
    );

    this.tags$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          MovieFiltersService.isWithinSearch(movie, filters) &&
          MovieFiltersService.isWithinRating(movie, filters) &&
          MovieFiltersService.isWithinLanguages(movie, filters) &&
          MovieFiltersService.isWithinYears(movie, filters) &&
          MovieFiltersService.isWithinTags(movie, filters) &&
          MovieFiltersService.isWithinGenres(movie, filters)
        )),
        // TODO get other files tags
        map(movies => movies.map(movie => movie.files[0].tags)
          .reduce((previous, current) => [...previous, ...current], [])
        ),
        map(tags => Array.from(new Set(tags)).sort())
      ))
    );

    this.languages$ = this.core.getConfig().pipe(
      filter(c => !!c),
      take(1),
      switchMap(config => this.filters.getFilters().pipe(
        switchMap(filters => this.movies.getAll().pipe(
          map(movies => movies.filter(movie =>
            MovieFiltersService.isWithinSearch(movie, filters) &&
            MovieFiltersService.isWithinRating(movie, filters) &&
            MovieFiltersService.isWithinTags(movie, filters) &&
            MovieFiltersService.isWithinYears(movie, filters) &&
            MovieFiltersService.isWithinGenres(movie, filters)
          )),
          map(movies => movies.map(movie => movie.original_language)),
          map(codes => codes.map(code => {
            const language = config.languages.find(l => l.iso_639_1 === code);
            return { code: language.iso_639_1, name: language.english_name };
          })),
          map(languages =>
            Array.from(new Set(languages.map(l => l.code))).map(
              code => ({ code, name: languages.find(l => l.code === code).name })
            ).sort((a, b) => a.name.localeCompare(b.name))
          )
        ))
      ))
    );

    this.genres$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          MovieFiltersService.isWithinSearch(movie, filters) &&
          MovieFiltersService.isWithinRating(movie, filters) &&
          MovieFiltersService.isWithinLanguages(movie, filters) &&
          MovieFiltersService.isWithinYears(movie, filters) &&
          MovieFiltersService.isWithinTags(movie, filters) &&
          MovieFiltersService.isWithinGenres(movie, filters)
        )),
        map(movies => movies
          .filter(movie => movie.details !== undefined)
          .map(movie => movie.details.genres)
          .reduce((previous, current) => [...previous, ...current], [])
          .map(g => g.name)
        ),
        map(genres => Array.from(new Set(genres)).sort())
      ))
    );

    this.subscriptions.push(
      this.search.valueChanges.subscribe(
        val => this.filters.setSearch(val)
      ),
      this.rating.valueChanges.subscribe(
        val => this.filters.setRating(val)
      ),
      this.years.valueChanges.subscribe(
        val => this.filters.setYears(val)
      ),
      this.languages.valueChanges.subscribe(
        val => this.filters.setLanguages(val)
      ),
      this.tags.valueChanges.subscribe(
        val => this.filters.setTags(val)
      ),
      this.genres.valueChanges.subscribe(
        val => this.filters.setGenres(val)
      ),

      this.filters.getSearch().subscribe(
        val => this.search.value !== val ?
          this.search.setValue(val) : {}
      ),
      this.filters.getRating().subscribe(
        val => this.rating.value !== val ?
          this.rating.setValue(val) : {}
      ),
      this.filters.getYears().subscribe(
        val => this.years.value !== val ?
          this.years.setValue(val) : {}
      ),
      this.filters.getLanguages().subscribe(
        val => this.languages.value !== val ?
          this.languages.setValue(val) : {}
      ),
      this.filters.getTags().subscribe(
        val => this.tags.value !== val ?
          this.tags.setValue(val) : {}
      ),
      this.filters.getGenres().subscribe(
        val => this.genres.value !== val ?
          this.genres.setValue(val) : {}
      )
    );
  }

  clearFilters(): void {
    this.filters.clear();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
