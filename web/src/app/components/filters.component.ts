import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Observable, of} from 'rxjs';
import {filter, map, skip, switchMap, take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {FormControl} from '@angular/forms';
import {FilterService, MovieFilters} from '@app/services/filter.service';
import {Movie} from '@app/models';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-filters',
  template: `
<!--    <mat-form-field floatLabel="never">
      <mat-label>Genre</mat-label>
      <mat-select multiple>
        <mat-option value="test">
          Test
        </mat-option>
      </mat-select>
    </mat-form-field>-->
    <ng-container *ngIf="showMovieFilters$ | async">
      <mat-form-field appearance="standard">
        <input [formControl]="search" matInput name="movie-search" placeholder="Search" spellcheck="false" />
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select [formControl]="rating" placeholder="Rating">
          <mat-option>All</mat-option>
          <mat-option *ngFor="let rating of ratings$ | async" [value]="rating">
            Above {{rating}}%
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select multiple [formControl]="years" placeholder="Year">
          <mat-option *ngFor="let year of years$ | async" [value]="year">
            {{ year }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select multiple [formControl]="languages" placeholder="Language">
          <mat-option *ngFor="let language of languages$ | async" [value]="language.code">
            {{ language.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select multiple [formControl]="tags" placeholder="Tags">
          <mat-option *ngFor="let tag of tags$ | async" [value]="tag">
            {{ tag }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select multiple [formControl]="genres" placeholder="Genres">
          <mat-option *ngFor="let genre of genres$ | async" [value]="genre">
            {{ genre }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <a class="clear" *ngIf="showClear$ | async" (click)="clearFilters()">clear</a>
    </ng-container>
  `,
  styles: [`
    mat-form-field {
      margin: 0 0 0 1rem;
      height: 90px;
      width: 180px;
    }
    .clear {
      text-decoration: underline;
      position: absolute;
      right: 16px;
      cursor: pointer;
      font-weight: 300;
      font-size: 14px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent implements OnInit {

  showMovieFilters$: Observable<boolean>;

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

  static isWithinSearch(movie: Movie, filters: MovieFilters): boolean {
    return filters.search === '' || filters.search
      .split(' ')
      .map(term => term.trim().toLowerCase())
      .every(term => JSON.stringify(movie).toLowerCase().includes(term));
  }

  static isWithinRating(movie: Movie, filters: MovieFilters): boolean {
    return movie.vote_average * 10 >= (filters.rating || 0);
  }

  static isWithinYears(movie: Movie, filters: MovieFilters): boolean {
    return filters.years.length === 0 || filters.years.includes(movie.release_date.substring(0, 4));
  }

  static isWithinLanguages(movie: Movie, filters: MovieFilters): boolean {
    return filters.languages.length === 0 || filters.languages.includes(movie.original_language);
  }

  static isWithinTags(movie: Movie, filters: MovieFilters): boolean {
    return filters.tags.length === 0 ||
      filters.tags.every(tag => movie.files[0].tags.indexOf(tag) > -1); // TODO check other files
  }

  static isWithinGenres(movie: Movie, filters: MovieFilters): boolean {
    return filters.genres.length === 0 ||
      filters.genres.every(genre =>
        movie.details && movie.details.genres.map(obj => obj.name).indexOf(genre) > -1
      );
  }

  constructor(
    private core: CoreService,
    private movies: MoviesService,
    private filters: FilterService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.showMovieFilters$ = this.core.getShowSidenav().pipe(
      switchMap(open => open ? of(false) : this.filters.getShowFilters())
    );
  }

  ngOnInit(): void {
    this.showClear$ = this.filters.getFilters().pipe(
      map(filters => filters.tags.length > 0 ||
        filters.rating !== 0 ||
        filters.languages.length > 0 ||
        filters.years.length > 0 ||
        filters.search !== '' ||
        filters.tags.length > 0 ||
        filters.genres.length > 0
      )
    );

    this.ratings$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinYears(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinGenres(movie, filters)
        )),
        map(movies => [90, 80, 70, 60, 50].filter(
          rating => movies.some(movie => movie.vote_average * 10 >= rating)
        ))
      ))
    );
    this.years$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinRating(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinGenres(movie, filters)
        )),
        map(movies => movies.map(movie => movie.release_date.substr(0, 4))),
        map(years => Array.from(new Set(years)).sort().reverse())
      ))
    );
    this.tags$ = this.filters.getFilters().pipe(
      switchMap(filters => this.movies.getAll().pipe(
        map(movies => movies.filter(movie =>
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinRating(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinYears(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinGenres(movie, filters)
        )),
        // TODO get other files tags
        map(movies => movies.map(movie => movie.files[0].tags).reduce((previous, current) => [...previous, ...current], [])),
        map(tags => Array.from(new Set(tags)).sort())
      ))
    );
    this.languages$ = this.core.getConfig().pipe(
      filter(c => !!c),
      take(1),
      switchMap(config => this.filters.getFilters().pipe(
        switchMap(filters => this.movies.getAll().pipe(
          map(movies => movies.filter(movie =>
            FiltersComponent.isWithinSearch(movie, filters) &&
            FiltersComponent.isWithinRating(movie, filters) &&
            FiltersComponent.isWithinTags(movie, filters) &&
            FiltersComponent.isWithinYears(movie, filters) &&
            FiltersComponent.isWithinGenres(movie, filters)
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
          FiltersComponent.isWithinSearch(movie, filters) &&
          FiltersComponent.isWithinRating(movie, filters) &&
          FiltersComponent.isWithinLanguages(movie, filters) &&
          FiltersComponent.isWithinYears(movie, filters) &&
          FiltersComponent.isWithinTags(movie, filters) &&
          FiltersComponent.isWithinGenres(movie, filters)
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

    this.search.valueChanges.subscribe(
      val => this.filters.setSearch(val)
    );
    this.rating.valueChanges.subscribe(
      val => this.filters.setRating(val)
    );
    this.years.valueChanges.subscribe(
      val => this.filters.setYears(val)
    );
    this.languages.valueChanges.subscribe(
      val => this.filters.setLanguages(val)
    );
    this.tags.valueChanges.subscribe(
      val => this.filters.setTags(val)
    );
    this.genres.valueChanges.subscribe(
      val => this.filters.setGenres(val)
    );

    this.filters.getSearch().subscribe(
      val => this.search.value !== val ?
        this.search.setValue(val) : {}
    );
    this.filters.getRating().subscribe(
      val => this.rating.value !== val ?
        this.rating.setValue(val) : {}
    );
    this.filters.getYears().subscribe(
      val => this.years.value !== val ?
        this.years.setValue(val) : {}
    );
    this.filters.getLanguages().subscribe(
      val => this.languages.value !== val ?
        this.languages.setValue(val) : {}
    );
    this.filters.getTags().subscribe(
      val => this.tags.value !== val ?
        this.tags.setValue(val) : {}
    );
    this.filters.getGenres().subscribe(
      val => this.genres.value !== val ?
        this.genres.setValue(val) : {}
    );

    this.filters.getFilters().pipe(skip(1)).subscribe(
      filters => this.router.navigate(
        [],
        {
          queryParams: {
            movie_search: filters.search !== '' ? filters.search : undefined,
            rating: filters.rating > 0 ? filters.rating : undefined,
            years: filters.years.length > 0 ? filters.years.join(',') : undefined,
            languages: filters.languages.length > 0 ? filters.languages.join(',') : undefined,
            tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
            genres: filters.genres.length > 0 ? filters.genres.join(',') : undefined,
          },
          queryParamsHandling: 'merge'
        })
    );

    this.route.queryParamMap.pipe(
      skip(1), // TODO: Not sure why, figure this out
      take(1)
    ).subscribe(params => {
      const search = params.get('movie_search');
      const rating = params.get('rating');
      const years = params.get('years');
      const languages = params.get('languages');
      const tags = params.get('tags');
      const genres = params.get('genres');
      if (search !== null) {
        this.filters.setSearch(search);
      }
      if (rating !== null) {
        this.filters.setRating(+rating);
      }
      if (years !== null) {
        this.filters.setYears(years.split(','));
      }
      if (languages !== null) {
        this.filters.setLanguages(languages.split(','));
      }
      if (tags !== null) {
        this.filters.setTags(tags.split(','));
      }
      if (genres !== null) {
        this.filters.setGenres(genres.split(','));
      }
    });
  }

  clearFilters(): void {
    this.filters.clear();
  }

}
