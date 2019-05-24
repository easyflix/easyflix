import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {
  getMovieGenresFilter,
  getMovieLanguagesFilter,
  getMovieRatingFilter,
  getMovieSearchFilter,
  getMovieTagsFilter,
  getMovieYearsFilter,
  State
} from '@app/reducers';
import {
  ClearMovieFilters,
  SetMovieGenres,
  SetMovieLanguages,
  SetMovieRating,
  SetMovieSearch,
  SetMovieTags,
  SetMovieYears
} from '@app/actions/movie-filters.actions';
import {Movie} from '@app/models';

@Injectable()
export class MovieFiltersService {

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

  constructor(private store: Store<State>) {

  }

  setSearch(value: string): void {
    this.store.dispatch(new SetMovieSearch(value));
  }

  setRating(value: number): void {
    this.store.dispatch(new SetMovieRating(value));
  }

  setYears(values: string[]): void {
    this.store.dispatch(new SetMovieYears(values));
  }

  setLanguages(values: string[]): void {
    this.store.dispatch(new SetMovieLanguages(values));
  }

  setTags(values: string[]): void {
    this.store.dispatch(new SetMovieTags(values));
  }

  setGenres(values: string[]): void {
    this.store.dispatch(new SetMovieGenres(values));
  }

  getSearch(): Observable<string> {
    return this.store.select(getMovieSearchFilter);
  }

  getRating(): Observable<number> {
    return this.store.select(getMovieRatingFilter);
  }

  getYears(): Observable<string[]> {
    return this.store.select(getMovieYearsFilter);
  }

  getLanguages(): Observable<string[]> {
    return this.store.select(getMovieLanguagesFilter);
  }

  getTags(): Observable<string[]> {
    return this.store.select(getMovieTagsFilter);
  }

  getGenres(): Observable<string[]> {
    return this.store.select(getMovieGenresFilter);
  }

  getFilters(): Observable<MovieFilters> {
    return combineLatest([
      this.getSearch(),
      this.getRating(),
      this.getYears(),
      this.getLanguages(),
      this.getTags(),
      this.getGenres()
    ]).pipe(
      map(array => ({
        search: array[0],
        rating: array[1],
        years: array[2],
        languages: array[3],
        tags: array[4],
        genres: array[5]
      }))
    );
  }

  filterMovies(movies: Movie[]): Observable<Movie[]> {
    return this.getFilters().pipe(
      map(filters => movies.filter(movie =>
        MovieFiltersService.isWithinSearch(movie, filters) &&
        MovieFiltersService.isWithinRating(movie, filters) &&
        MovieFiltersService.isWithinTags(movie, filters) &&
        MovieFiltersService.isWithinLanguages(movie, filters) &&
        MovieFiltersService.isWithinYears(movie, filters) &&
        MovieFiltersService.isWithinGenres(movie, filters)
      ))
    );
  }

  hasAppliedFilters(): Observable<boolean> {
    return this.getFilters().pipe(
      map(filters =>
        filters.tags.length > 0 ||
        filters.rating !== 0 ||
        filters.languages.length > 0 ||
        filters.years.length > 0 ||
        filters.search !== '' ||
        filters.genres.length > 0
      )
    );
  }

  clear(): void {
    this.store.dispatch(new ClearMovieFilters());
  }

}

export interface MovieFilters {
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  tags: string[];
  genres: string[];
}
