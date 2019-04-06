import { Injectable } from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Observable} from 'rxjs';
import {Action} from '@ngrx/store';
import {FilesActionTypes, LoadFilesError, LoadFilesSuccess} from '@app/actions/files.actions';
import {catchError, map, switchMap} from 'rxjs/operators';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {LibraryFile} from '@app/models/file';
import {of} from 'rxjs/internal/observable/of';

@Injectable()
export class AppEffects {

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

  constructor(private actions$: Actions, private httpClient: HttpClient) {}

}
