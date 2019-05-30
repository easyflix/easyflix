import {Injectable} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {
  getMovieFiltersShow,
  getMovieGenresFilter,
  getMovieLanguagesFilter,
  getMovieRatingFilter,
  getMovieSearchFilter,
  getMovieSortStrategy,
  getMovieTagsFilter,
  getMovieYearsFilter,
  State
} from '@app/reducers';
import {
  ClearMovieFilters,
  MovieSortStrategy,
  SetMovieGenres,
  SetMovieLanguages,
  SetMovieRating,
  SetMovieSearch,
  SetMovieSort,
  SetMovieTags,
  SetMovieYears,
  ToggleMovieFilters
} from '@app/actions/movie-filters.actions';
import {LibraryFile, Movie} from '@app/models';

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

  toggleFilters(): void {
    this.store.dispatch(new ToggleMovieFilters());
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

  setSort(strategy: MovieSortStrategy): void {
    this.store.dispatch(new SetMovieSort(strategy));
  }

  getShow(): Observable<boolean> {
    return this.store.select(getMovieFiltersShow);
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

  getSortStrategy(): Observable<MovieSortStrategy> {
    return this.store.select(getMovieSortStrategy);
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

  filterAndSort(movies: Movie[]): Observable<Movie[]> {
    function getLastModified(files: LibraryFile[]): number {
      return [...files].sort((a, b) => b.lastModified - a.lastModified)[0].lastModified;
    }
    return this.getFilters().pipe(
      map(filters => movies.filter(movie =>
        MovieFiltersService.isWithinSearch(movie, filters) &&
        MovieFiltersService.isWithinRating(movie, filters) &&
        MovieFiltersService.isWithinTags(movie, filters) &&
        MovieFiltersService.isWithinLanguages(movie, filters) &&
        MovieFiltersService.isWithinYears(movie, filters) &&
        MovieFiltersService.isWithinGenres(movie, filters)
      )),
      switchMap(movs => this.getSortStrategy().pipe(
        map(strategy => {
          if (strategy === 'alphabetical') {
            return movs;
          } else if (strategy === 'release') {
            return [...movs].sort((a, b) => b.release_date.localeCompare(a.release_date));
          } else if (strategy === 'addition') {
            return [...movs].sort((a, b) => getLastModified(b.files) - getLastModified(a.files));
          }
        })
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
