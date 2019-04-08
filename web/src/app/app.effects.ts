import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {FilesActionTypes, LoadFilesError, LoadFilesSuccess} from '@app/actions/files.actions';
import {catchError, map, switchMap} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Library, LibraryFile} from '@app/models/file';
import {of} from 'rxjs/internal/observable/of';
import {LibrariesActionTypes, LoadLibrariesError, LoadLibrariesSuccess} from '@app/actions/libraries.actions';

@Injectable()
export class AppEffects {

  /**
   * Load files
   */
  @Effect()
  loadFiles$: Observable<Action> =
    this.actions$.pipe(
      ofType(FilesActionTypes.LoadFiles),
      switchMap(() => this.httpClient.get('http://localhost:8081/api/videos').pipe(
        map(files => files as LibraryFile[])
      )),
      map(files => new LoadFilesSuccess(files)),
      catchError((error: HttpErrorResponse) => of(new LoadFilesError(error.message)))
    );

  /**
   * Load libraries
   */
  @Effect()
  loadLibraries$: Observable<Action> =
    this.actions$.pipe(
      ofType(LibrariesActionTypes.LoadLibraries),
      switchMap(() => this.httpClient.get('http://localhost:8081/api/libraries').pipe(
        map(libs => libs as Library[])
      )),
      map(libs => new LoadLibrariesSuccess(libs)),
      catchError((error: HttpErrorResponse) => of(new LoadLibrariesError(error.message)))
    );

  constructor(private actions$: Actions, private httpClient: HttpClient) {}

}
