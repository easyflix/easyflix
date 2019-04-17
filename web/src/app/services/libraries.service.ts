import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Library, LibraryFile} from '@app/models';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {getAllLibraries, getLibrariesLoaded, getLibraryByName, State} from '@app/reducers';
import {
  AddLibrary,
  LibrariesActionTypes,
  LoadLibraries,
  RemoveLibrary,
  ScanLibrary
} from '@app/actions/libraries.actions';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from '@app/services/service-helper';

@Injectable()
export class LibrariesService extends ServiceHelper {

  constructor(private httpClient: HttpClient, store: Store<State>, actions$: Actions) {
    super(store, actions$);
  }

  getAll(): Observable<Library[]> {
    return this.store.select(getAllLibraries);
  }

  getByName(name: string): Observable<Library> {
    return this.store.select(getLibraryByName, name);
  }

  load(): Observable<Library[]> {
    return this.dispatchActionObservable(
      new LoadLibraries(),
      LibrariesActionTypes.LoadLibrariesSuccess,
      LibrariesActionTypes.LoadLibrariesError
    );
  }

  add(library: Library): Observable<Library> {
    return this.dispatchActionObservable(
      new AddLibrary(library),
      LibrariesActionTypes.AddLibrarySuccess,
      LibrariesActionTypes.AddLibraryError
    );
  }

  remove(name: string): Observable<string> {
    return this.dispatchActionObservable(
      new RemoveLibrary(name),
      LibrariesActionTypes.RemoveLibrarySuccess,
      LibrariesActionTypes.RemoveLibraryError
    );
  }

  scan(name: string): Observable<LibraryFile[]> {
    return this.dispatchActionObservable(
      new ScanLibrary(name),
      LibrariesActionTypes.ScanLibrarySuccess,
      LibrariesActionTypes.ScanLibraryError
    );
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getLibrariesLoaded);
  }

}
