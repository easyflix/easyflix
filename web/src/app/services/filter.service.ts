import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {
  getLanguagesFilter,
  getRatingFilter,
  getSearchFilter,
  getShowFilters,
  getTagsFilter,
  getYearsFilter,
  State
} from '@app/reducers';
import {
  HideFilters,
  SetLanguages,
  SetRating,
  SetSearch,
  SetTags,
  SetYears,
  ShowFilters
} from '@app/actions/filters.actions';

@Injectable()
export class FilterService {

  constructor(private store: Store<State>) {

  }

  showFilters() {
    this.store.dispatch(new ShowFilters());
  }

  hideFilters() {
    this.store.dispatch(new HideFilters());
  }

  getShowFilters(): Observable<boolean> {
    return this.store.select(getShowFilters);
  }

  setSearch(value: string): void {
    this.store.dispatch(new SetSearch(value));
  }

  setRating(value: number): void {
    this.store.dispatch(new SetRating(value));
  }

  setYears(values: string[]): void {
    this.store.dispatch(new SetYears(values));
  }

  setLanguages(values: string[]): void {
    this.store.dispatch(new SetLanguages(values));
  }

  setTags(values: string[]): void {
    this.store.dispatch(new SetTags(values));
  }

  getSearch(): Observable<string> {
    return this.store.select(getSearchFilter);
  }

  getRating(): Observable<number> {
    return this.store.select(getRatingFilter);
  }

  getYears(): Observable<string[]> {
    return this.store.select(getYearsFilter);
  }

  getLanguages(): Observable<string[]> {
    return this.store.select(getLanguagesFilter);
  }

  getTags(): Observable<string[]> {
    return this.store.select(getTagsFilter);
  }

  getFilters(): Observable<MovieFilters> {
    return combineLatest([
      this.getSearch(),
      this.getRating(),
      this.getYears(),
      this.getLanguages(),
      this.getTags()
    ]).pipe(
      map(array => ({
        search: array[0],
        rating: array[1],
        years: array[2],
        languages: array[3],
        tags: array[4],
      }))
    );
  }

}

export interface MovieFilters {
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  tags: string[];
}
