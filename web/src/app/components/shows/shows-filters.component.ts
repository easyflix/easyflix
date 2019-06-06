import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {ShowFiltersService} from '@app/services/show-filters.service';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {ShowsService} from '@app/services/shows.service';

@Component({
  selector: 'app-shows-filters',
  template: `
      <mat-form-field appearance="standard">
        <input [formControl]="search" matInput name="show-search" placeholder="Search" spellcheck="false" />
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
        <mat-select multiple [formControl]="networks" placeholder="Networks">
          <mat-option *ngFor="let network of networks$ | async" [value]="network">
            {{ network }}
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
export class ShowsFiltersComponent implements OnInit, OnDestroy {

  search = new FormControl();
  rating = new FormControl();
  years = new FormControl();
  languages = new FormControl();
  networks = new FormControl();
  genres = new FormControl();

  ratings$: Observable<number[]>;
  years$: Observable<string[]>;
  languages$: Observable<{ code: string; name: string }[]>;
  networks$: Observable<string[]>;
  genres$: Observable<string[]>;

  showClear$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  constructor(
    private core: CoreService,
    private shows: ShowsService,
    private filters: ShowFiltersService,
  ) {}

  ngOnInit(): void {
    this.showClear$ = this.filters.hasAppliedFilters();

    this.ratings$ = this.filters.getFilters().pipe(
      switchMap(filters => this.shows.getAll().pipe(
        map(shows => shows.filter(show =>
          ShowFiltersService.isWithinSearch(show, filters) &&
          ShowFiltersService.isWithinLanguages(show, filters) &&
          ShowFiltersService.isWithinYears(show, filters) &&
          ShowFiltersService.isWithinNetworks(show, filters) &&
          ShowFiltersService.isWithinGenres(show, filters)
        )),
        map(shows => [90, 80, 70, 60, 50].filter(
          rating => shows.some(show => show.vote_average * 10 >= rating)
        ))
      ))
    );

    // TODO year per season
    this.years$ = this.filters.getFilters().pipe(
      switchMap(filters => this.shows.getAll().pipe(
        map(shows => shows.filter(show =>
          ShowFiltersService.isWithinSearch(show, filters) &&
          ShowFiltersService.isWithinRating(show, filters) &&
          ShowFiltersService.isWithinLanguages(show, filters) &&
          ShowFiltersService.isWithinNetworks(show, filters) &&
          ShowFiltersService.isWithinGenres(show, filters)
        )),
        map(shows => shows.map(show => show.first_air_date.substr(0, 4))),
        map(years => Array.from(new Set(years)).sort().reverse())
      ))
    );

    this.networks$ = this.filters.getFilters().pipe(
      switchMap(filters => this.shows.getAll().pipe(
        map(shows => shows.filter(show =>
          ShowFiltersService.isWithinSearch(show, filters) &&
          ShowFiltersService.isWithinRating(show, filters) &&
          ShowFiltersService.isWithinLanguages(show, filters) &&
          ShowFiltersService.isWithinYears(show, filters) &&
          // ShowFiltersService.isWithinNetworks(show, filters) &&
          ShowFiltersService.isWithinGenres(show, filters)
        )),
        map(shows => shows.filter(show => show.details !== undefined)),
        map(shows => shows.map(show => show.details.networks)
          .reduce((previous, current) => [...previous, ...current], [])
        ),
        map(networks => networks.map(network => network.name)),
        map(networks => Array.from(new Set(networks)).sort())
      ))
    );

    this.languages$ = this.core.getConfig().pipe(
      filter(c => !!c),
      take(1),
      switchMap(config => this.filters.getFilters().pipe(
        switchMap(filters => this.shows.getAll().pipe(
          map(shows => shows.filter(show =>
            ShowFiltersService.isWithinSearch(show, filters) &&
            ShowFiltersService.isWithinRating(show, filters) &&
            ShowFiltersService.isWithinNetworks(show, filters) &&
            ShowFiltersService.isWithinYears(show, filters) &&
            ShowFiltersService.isWithinGenres(show, filters)
          )),
          map(shows => shows.map(show => show.original_language)),
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
      switchMap(filters => this.shows.getAll().pipe(
        map(shows => shows.filter(show =>
          ShowFiltersService.isWithinSearch(show, filters) &&
          ShowFiltersService.isWithinRating(show, filters) &&
          ShowFiltersService.isWithinLanguages(show, filters) &&
          ShowFiltersService.isWithinYears(show, filters) &&
          ShowFiltersService.isWithinNetworks(show, filters) &&
          ShowFiltersService.isWithinGenres(show, filters)
        )),
        map(shows => shows
          .filter(show => show.details !== undefined)
          .map(show => show.details.genres)
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
      this.networks.valueChanges.subscribe(
        val => this.filters.setNetworks(val)
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
      this.filters.getNetworks().subscribe(
        val => this.networks.value !== val ?
          this.networks.setValue(val) : {}
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
