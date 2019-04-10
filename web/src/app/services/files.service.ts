import {Injectable} from '@angular/core';
import {Observable, zip} from 'rxjs';

import {Folder, Library, LibraryFile} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {getAllFiles, getFileById, getFilesLoaded, getFilesOfFolder, State} from '@app/reducers';
import {LoadFiles} from '@app/actions/files.actions';

@Injectable()
export class FilesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  getAll(): Observable<LibraryFile[]> {
    return this.store.select(getAllFiles);
  }

  getFilesOfFolder(folder: Folder | Library): Observable<LibraryFile[]> {
    return this.store.select(getFilesOfFolder, folder);
  }

  getById(id: string): Observable<LibraryFile> {
    return this.store.select(getFileById, id);
  }

  getByIds(ids: string[]): Observable<LibraryFile[]> {
    return zip(...ids.map(id => this.store.select(getFileById, id)));
  }

  getLoaded(): Observable<boolean> {
    return this.store.select(getFilesLoaded);
  }

  load() {
    this.store.dispatch(new LoadFiles());
  }

}
