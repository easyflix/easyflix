import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {
  getShowFiltersShow,
  getShowGenresFilter,
  getShowLanguagesFilter,
  getShowNetworksFilter,
  getShowRatingFilter,
  getShowSearchFilter,
  getShowYearsFilter,
  State
} from '@app/reducers';
import {
  ClearShowFilters,
  SetShowGenres,
  SetShowLanguages,
  SetShowNetworks,
  SetShowRating,
  SetShowSearch,
  SetShowYears,
  ToggleShowFilters
} from '@app/actions/show-filters.actions';
import {Show} from '@app/models/show';

@Injectable()
export class ShowFiltersService {

  static isWithinSearch(show: Show, filters: ShowFilters): boolean {
    return filters.search === '' || filters.search
      .split(' ')
      .map(term => term.trim().toLowerCase())
      .every(term => JSON.stringify(show).toLowerCase().includes(term));
  }

  static isWithinRating(show: Show, filters: ShowFilters): boolean {
    return show.vote_average * 10 >= (filters.rating || 0);
  }

  // TODO should check each season
  static isWithinYears(show: Show, filters: ShowFilters): boolean {
    return filters.years.length === 0 || filters.years.includes(show.first_air_date.substring(0, 4));
  }

  static isWithinLanguages(show: Show, filters: ShowFilters): boolean {
    return filters.languages.length === 0 || filters.languages.includes(show.original_language);
  }

  static isWithinNetworks(show: Show, filters: ShowFilters): boolean {
    return filters.networks.length === 0 ||
      filters.networks.some(network =>
        show.details && show.details.networks.map(net => net.name).includes(network)
      );
  }

  static isWithinGenres(show: Show, filters: ShowFilters): boolean {
    return filters.genres.length === 0 ||
      filters.genres.every(genre =>
        show.details && show.details.genres.map(obj => obj.name).indexOf(genre) > -1
      );
  }

  constructor(private store: Store<State>) {

  }

  toggleFilters(): void {
    this.store.dispatch(new ToggleShowFilters());
  }

  setSearch(value: string): void {
    this.store.dispatch(new SetShowSearch(value));
  }

  setRating(value: number): void {
    this.store.dispatch(new SetShowRating(value));
  }

  setYears(values: string[]): void {
    this.store.dispatch(new SetShowYears(values));
  }

  setLanguages(values: string[]): void {
    this.store.dispatch(new SetShowLanguages(values));
  }

  setNetworks(values: string[]): void {
    this.store.dispatch(new SetShowNetworks(values));
  }

  setGenres(values: string[]): void {
    this.store.dispatch(new SetShowGenres(values));
  }

  getShow(): Observable<boolean> {
    return this.store.select(getShowFiltersShow);
  }

  getSearch(): Observable<string> {
    return this.store.select(getShowSearchFilter);
  }

  getRating(): Observable<number> {
    return this.store.select(getShowRatingFilter);
  }

  getYears(): Observable<string[]> {
    return this.store.select(getShowYearsFilter);
  }

  getLanguages(): Observable<string[]> {
    return this.store.select(getShowLanguagesFilter);
  }

  getNetworks(): Observable<string[]> {
    return this.store.select(getShowNetworksFilter);
  }

  getGenres(): Observable<string[]> {
    return this.store.select(getShowGenresFilter);
  }

  getFilters(): Observable<ShowFilters> {
    return combineLatest([
      this.getSearch(),
      this.getRating(),
      this.getYears(),
      this.getLanguages(),
      this.getNetworks(),
      this.getGenres()
    ]).pipe(
      map(array => ({
        search: array[0],
        rating: array[1],
        years: array[2],
        languages: array[3],
        networks: array[4],
        genres: array[5]
      }))
    );
  }

  filterShows(shows: Show[]): Observable<Show[]> {
    return this.getFilters().pipe(
      map(filters => shows.filter(show =>
        ShowFiltersService.isWithinSearch(show, filters) &&
        ShowFiltersService.isWithinRating(show, filters) &&
        ShowFiltersService.isWithinNetworks(show, filters) &&
        ShowFiltersService.isWithinLanguages(show, filters) &&
        ShowFiltersService.isWithinYears(show, filters) &&
        ShowFiltersService.isWithinGenres(show, filters)
      ))
    );
  }

  hasAppliedFilters(): Observable<boolean> {
    return this.getFilters().pipe(
      map(filters =>
        filters.networks.length > 0 ||
        filters.rating !== 0 ||
        filters.languages.length > 0 ||
        filters.years.length > 0 ||
        filters.search !== '' ||
        filters.genres.length > 0
      )
    );
  }

  clear(): void {
    this.store.dispatch(new ClearShowFilters());
  }

}

export interface ShowFilters {
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  networks: string[];
  genres: string[];
}
