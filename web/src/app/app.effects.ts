import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';

import {FilesActionTypes, LoadFiles, LoadFilesError, LoadFilesSuccess} from '@app/actions/files.actions';
import {LibraryFile, Library, MediaType} from '@app/models';
import {
  AddLibrary,
  AddLibraryError,
  AddLibrarySuccess,
  LibrariesActionTypes,
  LoadLibrariesError,
  LoadLibrariesSuccess,
  RemoveLibrary,
  RemoveLibraryError,
  RemoveLibrarySuccess, ScanLibrary, ScanLibraryError, ScanLibrarySuccess
} from '@app/actions/libraries.actions';
import {ChangeTheme, CoreActionTypes} from '@app/actions/core.actions';
import {OverlayContainer} from '@angular/cdk/overlay';

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
        this.httpClient.get('http://localhost:8081/api/libraries/' + encodeURIComponent(action.payload.name)).pipe(
          map((result: { library: Library, files: LibraryFile[] }) => new LoadFilesSuccess(result.files)),
          catchError((error: HttpErrorResponse) => of(new LoadFilesError(error.message)))
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
        this.httpClient.get('http://localhost:8081/api/libraries').pipe(
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
        this.httpClient.post('http://localhost:8081/api/libraries', action.payload).pipe(
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
        this.httpClient.delete('http://localhost:8081/api/libraries/' + encodeURIComponent(action.payload.name)).pipe(
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
        this.httpClient.post('http://localhost:8081/api/libraries/' + encodeURIComponent(action.payload.name) + '/scan', null).pipe(
          map((files: LibraryFile[]) => new ScanLibrarySuccess(files, action.payload)),
          catchError((error: HttpErrorResponse) => of(new ScanLibraryError(error.error, action.payload)))
        )
      )
    );

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private overlayContainer: OverlayContainer,
  ) {}

}
