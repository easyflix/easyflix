import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Action} from '@ngrx/store';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';

import {FilesActionTypes, LoadFilesError, LoadFilesSuccess} from '@app/actions/files.actions';
import {Library, LibraryFile} from '@app/models/file';
import {
  AddLibrary, AddLibraryError, AddLibrarySuccess,
  LibrariesActionTypes,
  LoadLibrariesError,
  LoadLibrariesSuccess, RemoveLibrary, RemoveLibraryError, RemoveLibrarySuccess
} from '@app/actions/libraries.actions';

@Injectable()
export class AppEffects {

  /**
   * Load files
   */
  @Effect()
  loadFiles$: Observable<Action> =
    this.actions$.pipe(
      ofType(FilesActionTypes.LoadFiles),
      switchMap(() =>
        this.httpClient.get('http://localhost:8081/api/videos').pipe(
          map((files: LibraryFile[]) => new LoadFilesSuccess(files)),
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
  addLibrary$: Observable<any> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.AddLibrary),
      switchMap((action: AddLibrary) =>
        this.httpClient.post('http://localhost:8081/api/libraries', action.payload).pipe(
          map((library: Library) => new AddLibrarySuccess(library)),
          catchError((error: HttpErrorResponse) => of(new AddLibraryError(error.error)))
        )
      )
    );

  /**
   * Remove Library
   */
  @Effect()
  removeLibrary$: Observable<any> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.RemoveLibrary),
      switchMap((action: RemoveLibrary) =>
        this.httpClient.delete('http://localhost:8081/api/libraries/' + encodeURIComponent(action.payload)).pipe(
          map((libraryName: string) => new RemoveLibrarySuccess(libraryName)),
          catchError((error: HttpErrorResponse) => of(new RemoveLibraryError(error.error)))
        )
      )
    );

  constructor(private actions$: Actions, private httpClient: HttpClient) {}

}
