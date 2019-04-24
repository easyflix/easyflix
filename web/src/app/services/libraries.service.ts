import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Library, LibraryFile} from '@app/models';
import {Store} from '@ngrx/store';
import {getAllLibraries, getLibrariesLoaded, getLibraryByName, State} from '@app/reducers';
import {
  AddLibrary,
  LibrariesActionTypes, LibraryUpdate,
  LoadLibraries,
  RemoveLibrary,
  ScanLibrary
} from '@app/actions/libraries.actions';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from '@app/services/service-helper';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';
import {filter, tap} from 'rxjs/operators';

@Injectable()
export class LibrariesService extends ServiceHelper {

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>,
    actions$: Actions
  ) {
    super(store, actions$);

    this.socketClient.getSocket().pipe(
      filter(message => message.method === 'LibraryUpdate'),
      tap(message => this.updateLibrary(message.entity))
    ).subscribe();

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

  remove(library: Library): Observable<string> {
    return this.dispatchActionObservable(
      new RemoveLibrary(library),
      LibrariesActionTypes.RemoveLibrarySuccess,
      LibrariesActionTypes.RemoveLibraryError
    );
  }

  scan(library: Library): Observable<LibraryFile[]> {
    return this.dispatchActionObservable(
      new ScanLibrary(library),
      LibrariesActionTypes.ScanLibrarySuccess,
      LibrariesActionTypes.ScanLibraryError
    );
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getLibrariesLoaded);
  }

  private updateLibrary(library: Library): void {
    this.store.dispatch(new LibraryUpdate(library));
  }

}
