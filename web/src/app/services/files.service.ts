import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {Folder, Library, LibraryFile} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {getAllFiles, getAllLibraries, getFilesByIds, getFilesOfFolder, getLibraryByName, State} from '@app/reducers';
import {LoadFiles} from '@app/actions/files.actions';
import {LoadLibraries} from '@app/actions/libraries.actions';

@Injectable()
export class FilesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  getAllFiles(): Observable<LibraryFile[]> {
    return this.store.select(getAllFiles);
  }

  getFilesOfFolder(folder: Folder | Library): Observable<LibraryFile[]> {
    return this.store.select(getFilesOfFolder, folder);
  }

  getFilesByIds(ids: string[]): Observable<LibraryFile[]> {
    return this.store.select(getFilesByIds, ids);
  }

  getAllLibraries(): Observable<Library[]> {
    return this.store.select(getAllLibraries);
  }

  getLibraryByName(name: string): Observable<Library> {
    return this.store.select(getLibraryByName, name);
  }

  loadFiles() {
    this.store.dispatch(new LoadFiles());
  }

  loadLibrairies() {
    this.store.dispatch(new LoadLibraries());
  }

}
