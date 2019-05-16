import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {asapScheduler, Observable, of, scheduled} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';

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

  constructor(
    private actions$: Actions,
    private socketClient: HttpSocketClientService,
    private overlayContainer: OverlayContainer,
  ) {}

}
