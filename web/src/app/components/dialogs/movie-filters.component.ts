import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ConfirmData} from '@app/components/dialogs/confirm-dialog.component';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {filter, map, skip, switchMap, take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-filters-movies',
  template: `
    <h3 mat-dialog-title>Movie filters</h3>
    <div mat-dialog-content class="container">
      <mat-form-field appearance="standard">
        <input [formControl]="search" matInput name="movie-search" placeholder="Search" spellcheck="false" />
      </mat-form-field>
      <mat-form-field appearance="standard">
        <mat-select multiple [formControl]="genres" placeholder="Genres">
          <mat-option *ngFor="let genre of genres$ | async" [value]="genre">
            {{ genre }}
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
        <mat-select [formControl]="rating" placeholder="Rating">
          <mat-option>All</mat-option>
          <mat-option *ngFor="let rating of ratings$ | async" [value]="rating">
            Above {{rating}}%
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-raised-button [mat-dialog-close]="true">Close</button>
      <button mat-raised-button *ngIf="showClear$ | async"
              color="warn"
              (click)="clearFilters()"
              [mat-dialog-close]="false">Clear</button>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      flex-wrap: wrap;
    }
    mat-form-field {
      flex-basis: calc(50% - .5rem);
    }
    mat-form-field:nth-child(2n + 1) {
      margin-right: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieFiltersComponent implements OnInit, OnDestroy {

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
    private dialogRef: MatDialogRef<MovieFiltersComponent>,
    private core: CoreService,
    private movies: MoviesService,
    private filters: MovieFiltersService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData
  ) {}

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
