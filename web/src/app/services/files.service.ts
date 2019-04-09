import {Injectable} from '@angular/core';
import {Observable, zip} from 'rxjs';

import {Folder, Library, LibraryFile} from '@app/models/file';
import {HttpClient} from '@angular/common/http';
import {Store} from '@ngrx/store';
import {
  getAllFiles,
  getAllLibraries,
  getFileById,
  getFilesLoaded,
  getFilesOfFolder, getLibrariesError,
  getLibraryByName,
  State
} from '@app/reducers';
import {LoadFiles} from '@app/actions/files.actions';
import {AddLibrary, LoadLibraries, RemoveLibrary} from '@app/actions/libraries.actions';

@Injectable()
export class FilesService {

  constructor(private httpClient: HttpClient, private store: Store<State>) {}

  getAllFiles(): Observable<LibraryFile[]> {
    return this.store.select(getAllFiles);
  }

  getFilesOfFolder(folder: Folder | Library): Observable<LibraryFile[]> {
    return this.store.select(getFilesOfFolder, folder);
  }

  getFileById(id: string): Observable<LibraryFile> {
    return this.store.select(getFileById, id);
  }

  getFilesByIds(ids: string[]): Observable<LibraryFile[]> {
    return zip(...ids.map(id => this.store.select(getFileById, id)));
  }

  getFilesLoaded(): Observable<boolean> {
    return this.store.select(getFilesLoaded);
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

  addLibrary(library: Library) {
    this.store.dispatch(new AddLibrary(library));
  }

  removeLibrary(name: string) {
    this.store.dispatch(new RemoveLibrary(name));
  }

  getLibrariesError(): Observable<string> {
    return this.store.select(getLibrariesError);
  }

}
