import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Library} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {
  getAllLibraries,
  getLibrariesAdding,
  getLibrariesError,
  getLibrariesLoaded,
  getLibraryByName,
  State
} from '@app/reducers';
import {AddLibrary, LoadLibraries, RemoveLibrary} from '@app/actions/libraries.actions';

@Injectable()
export class LibrariesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  getAll(): Observable<Library[]> {
    return this.store.select(getAllLibraries);
  }

  getByName(name: string): Observable<Library> {
    return this.store.select(getLibraryByName, name);
  }

  load() {
    this.store.dispatch(new LoadLibraries());
  }

  add(library: Library) {
    this.store.dispatch(new AddLibrary(library));
  }

  remove(name: string) {
    this.store.dispatch(new RemoveLibrary(name));
  }

  getError(): Observable<string> {
    return this.store.select(getLibrariesError);
  }

  getAdding(): Observable<boolean> {
    return this.store.select(getLibrariesAdding);
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getLibrariesLoaded);
  }

}
