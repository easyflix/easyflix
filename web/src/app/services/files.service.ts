import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

import {Library, LibraryFile} from '@app/models';
import {Store} from '@ngrx/store';
import {
  getAllFiles,
  getFileById,
  getFileByPath,
  getFilesOfFolder,
  getFolderCount,
  getLibraryCount,
  State
} from '@app/reducers';
import {AddFiles, FilesActionTypes, LoadFiles} from '@app/actions/files.actions';
import {Actions} from '@ngrx/effects';
import {ServiceHelper} from './service-helper';
import {HttpSocketClientService} from './http-socket-client.service';
import {bufferTime, filter, tap} from 'rxjs/operators';

@Injectable()
export class FilesService extends ServiceHelper {

  private subscriptions: Subscription[] = [];

  constructor(
    private socketClient: HttpSocketClientService,
    store: Store<State>, actions$: Actions
  ) {
    super(store, actions$);
  }

  init() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.push(
      this.socketClient.observe('FileAdded').pipe(
        bufferTime(100, null, 15),
        filter(files => files.length > 0),
        tap((files: LibraryFile[]) => this.store.dispatch(new AddFiles(files)))
      ).subscribe()
    );
  }

  getAll(): Observable<LibraryFile[]> {
    return this.store.select(getAllFiles);
  }

  getFilesOfFolder(folder: LibraryFile): Observable<LibraryFile[]> {
    return this.store.select(getFilesOfFolder, folder);
  }

  // TODO figure out if by id or by path is better
  getById(id: string): Observable<LibraryFile> {
    return this.store.select(getFileById, id);
  }

  getByPath(path: string): Observable<LibraryFile> {
    return this.store.select(getFileByPath, path);
  }

  /*getByIds(ids: string[]): Observable<LibraryFile[]> {
    return zip(...ids.map(id => this.store.select(getFileById, id)));
  }*/

  load(library: Library): Observable<LibraryFile[]> {
    return this.dispatchActionObservable(
      new LoadFiles(library),
      FilesActionTypes.LoadFilesSuccess,
      FilesActionTypes.LoadFilesError
    );
  }

  getFolderCount(folder: LibraryFile): Observable<number> {
    return this.store.select(getFolderCount, folder);
  }

  getLibraryCount(library: Library): Observable<number> {
    return this.store.select(getLibraryCount, library);
  }

}
