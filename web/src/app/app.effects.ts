import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {asapScheduler, Observable, of, scheduled} from 'rxjs';
import {catchError, filter, map, skip, switchMap, tap} from 'rxjs/operators';

import {FilesActionTypes, LoadFiles, LoadFilesError, LoadFilesSuccess} from '@app/actions/files.actions';
import {Library, LibraryFile, Movie} from '@app/models';
import {
  AddLibrary,
  AddLibraryError,
  AddLibrarySuccess,
  LibrariesActionTypes,
  LoadLibrariesError,
  LoadLibrariesSuccess,
  RemoveLibrary,
  RemoveLibraryError,
  RemoveLibrarySuccess,
  ScanLibrary,
  ScanLibraryError,
  ScanLibrarySuccess
} from '@app/actions/libraries.actions';
import {ChangeTheme, CoreActionTypes, LoadConfigError, LoadConfigSuccess} from '@app/actions/core.actions';
import {OverlayContainer} from '@angular/cdk/overlay';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';
import {LoadMoviesError, LoadMoviesSuccess, MoviesActionTypes} from '@app/actions/movies.actions';
import {Configuration} from '@app/models/configuration';
import {LoadShowsError, LoadShowsSuccess, ShowsActionTypes} from '@app/actions/shows.actions';
import {Show} from '@app/models/show';
import {MovieFilters, MovieFiltersService} from '@app/services/movie-filters.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ShowFilters, ShowFiltersService} from '@app/services/show-filters.service';
import {CoreService} from '@app/services/core.service';

@Injectable()
export class AppEffects {

  /**
   * Change Theme
   */
  @Effect({ dispatch: false })
  themes$: Observable<void> =
    this.actions$.pipe(
      ofType<ChangeTheme>(CoreActionTypes.ChangeTheme),
      tap((action: ChangeTheme) => {
        this.overlayContainer.getContainerElement().className = 'cdk-overlay-container ' + action.payload.cssClass;
      }),
      map(() => {})
    );

  /**
   * Load files
   */
  @Effect()
  loadFiles$: Observable<Action> =
    this.actions$.pipe(
      ofType(FilesActionTypes.LoadFiles),
      switchMap((action: LoadFiles) =>
        this.socketClient.get('/api/libraries/' + encodeURIComponent(action.payload.name)).pipe(
          map((result: { library: Library, files: LibraryFile[] }) => new LoadFilesSuccess(result.files)),
          catchError((error: HttpErrorResponse) => of(new LoadFilesError(error.message)))
        )
      )
    );

  /**
   * Load movies
   */
  @Effect()
  loadMovies$: Observable<Action> =
    this.actions$.pipe(
      ofType(MoviesActionTypes.LoadMovies),
      switchMap(() =>
        this.socketClient.get('/api/movies').pipe(
          map((movies: Movie[]) => new LoadMoviesSuccess(movies)),
          catchError((error: HttpErrorResponse) => scheduled([new LoadMoviesError(error.message)], asapScheduler))
        )
      )
    );

  /**
   * Load shows
   */
  @Effect()
  loadShows$: Observable<Action> =
    this.actions$.pipe(
      ofType(ShowsActionTypes.LoadShows),
      switchMap(() =>
        this.socketClient.get('/api/shows').pipe(
          map((shows: Show[]) => new LoadShowsSuccess(shows)),
          catchError((error: HttpErrorResponse) => scheduled([new LoadShowsError(error.message)], asapScheduler))
        )
      )
    );

  /**
   * Load libraries
   */
  @Effect()
  loadLibraries$: Observable<Action> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.LoadLibraries),
      switchMap(() =>
        this.socketClient.get('/api/libraries').pipe(
          map((libs: Library[]) => new LoadLibrariesSuccess(libs)),
          catchError((error: HttpErrorResponse) => of(new LoadLibrariesError(error.message)))
        )
      )
    );

  /**
   * Add Library
   */
  @Effect()
  addLibrary$: Observable<Action> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.AddLibrary),
      switchMap((action: AddLibrary) =>
        this.socketClient.post('/api/libraries', action.payload).pipe(
          map((library: Library) =>
            new AddLibrarySuccess(library) // , new LoadFilesSuccess(response.files))
          ),
          catchError((error: HttpErrorResponse) => of(new AddLibraryError(error.error)))
        )
      )
    );

  /**
   * Remove Library
   */
  @Effect()
  removeLibrary$: Observable<Action> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.RemoveLibrary),
      switchMap((action: RemoveLibrary) =>
        this.socketClient.delete('/api/libraries/' + encodeURIComponent(action.payload.name)).pipe(
          map(() => new RemoveLibrarySuccess(action.payload)),
          catchError((error: HttpErrorResponse) => of(new RemoveLibraryError(error.error)))
        )
      )
    );

  /**
   * Scan Library
   */
  @Effect()
  scanLibrary$: Observable<Action> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.ScanLibrary),
      switchMap((action: ScanLibrary) =>
        this.socketClient.post('/api/libraries/' + encodeURIComponent(action.payload.name) + '/scan', null).pipe(
          map((files: LibraryFile[]) => new ScanLibrarySuccess(files, action.payload)),
          catchError((error: HttpErrorResponse) => of(new ScanLibraryError(error.error, action.payload)))
        )
      )
    );

  /**
   * Load Config
   */
  @Effect()
  loadConfig$: Observable<Action> =
    this.actions$.pipe(
      ofType(CoreActionTypes.LoadConfig),
      switchMap(() =>
        this.socketClient.get('/api/config/').pipe(
          map((config: Configuration) => new LoadConfigSuccess(config)),
          catchError((error: HttpErrorResponse) => scheduled([new LoadConfigError(error.error)], asapScheduler))
        )
      )
    );

  /**
   * Movie filters
   */
  @Effect({ dispatch: false })
  moviesFilters2Url$: Observable<MovieFilters> =
    this.movieFilters.getFilters().pipe(
      skip(1),
      tap(filters => this.router.navigate(
        [],
        {
          queryParams: {
            movie_search: filters.search !== '' ? filters.search : undefined,
            movie_rating: filters.rating > 0 ? filters.rating : undefined,
            movie_years: filters.years.length > 0 ? filters.years.join(',') : undefined,
            movie_languages: filters.languages.length > 0 ? filters.languages.join(',') : undefined,
            movie_tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
            movie_genres: filters.genres.length > 0 ? filters.genres.join(',') : undefined,
          },
          queryParamsHandling: 'merge'
        })
      )
  );
  @Effect({ dispatch: false })
  moviesUrl2Filters$ =
    this.route.queryParamMap.pipe(
      skip(1),
      map(params => {
        const search = params.get('movie_search');
        const rating = params.get('movie_rating');
        const years = params.get('movie_years');
        const languages = params.get('movie_languages');
        const tags = params.get('movie_tags');
        const genres = params.get('movie_genres');
        if (search !== null) {
          this.movieFilters.setSearch(search);
        }
        if (rating !== null) {
          this.movieFilters.setRating(+rating);
        }
        if (years !== null) {
          this.movieFilters.setYears(years.split(','));
        }
        if (languages !== null) {
          this.movieFilters.setLanguages(languages.split(','));
        }
        if (tags !== null) {
          this.movieFilters.setTags(tags.split(','));
        }
        if (genres !== null) {
          this.movieFilters.setGenres(genres.split(','));
        }
      })
    );

  /**
   * Show filters
   */
  @Effect({ dispatch: false })
  showsFilters2Url$: Observable<ShowFilters> =
    this.showFilters.getFilters().pipe(
      skip(1),
      tap(filters => this.router.navigate(
        [],
        {
          queryParams: {
            show_search: filters.search !== '' ? filters.search : undefined,
            show_rating: filters.rating > 0 ? filters.rating : undefined,
            show_years: filters.years.length > 0 ? filters.years.join(',') : undefined,
            show_languages: filters.languages.length > 0 ? filters.languages.join(',') : undefined,
            show_networks: filters.networks.length > 0 ? filters.networks.join(',') : undefined,
            show_genres: filters.genres.length > 0 ? filters.genres.join(',') : undefined,
          },
          queryParamsHandling: 'merge'
        })
      )
    );
  @Effect({ dispatch: false })
  showsUrl2Filters$ =
    this.route.queryParamMap.pipe(
      skip(1),
      map(params => {
        const search = params.get('show_search');
        const rating = params.get('show_rating');
        const years = params.get('show_years');
        const languages = params.get('show_languages');
        const networks = params.get('show_networks');
        const genres = params.get('show_genres');
        if (search !== null) {
          this.showFilters.setSearch(search);
        }
        if (rating !== null) {
          this.showFilters.setRating(+rating);
        }
        if (years !== null) {
          this.showFilters.setYears(years.split(','));
        }
        if (languages !== null) {
          this.showFilters.setLanguages(languages.split(','));
        }
        if (networks !== null) {
          this.showFilters.setNetworks(networks.split(','));
        }
        if (genres !== null) {
          this.showFilters.setGenres(genres.split(','));
        }
      })
    );

  /**
   * Sidenav
   */
  @Effect({ dispatch: false })
  sidenav$ = this.core.getShowSidenav().pipe(
    skip(1),
    tap(show => this.router.navigate(
      [],
      { queryParams: { sidenav: show ? '1' : null }, queryParamsHandling: 'merge' })
    )
  );
  @Effect({ dispatch: false })
  sidenavUrl$ = this.route.queryParamMap.pipe(
    map(params => params.get('sidenav')),
    filter(sidenav => sidenav !== null),
    tap(sidenav => +sidenav === 1 ? this.core.openSidenav() : this.core.closeSidenav())
  );

  constructor(
    private core: CoreService,
    private actions$: Actions,
    private socketClient: HttpSocketClientService,
    private overlayContainer: OverlayContainer,
    private movieFilters: MovieFiltersService,
    private showFilters: ShowFiltersService,
    private router: Router,
    private route: ActivatedRoute
  ) {

  }

}
