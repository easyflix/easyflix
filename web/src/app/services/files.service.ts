import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {Folder, Library, LibraryFile} from '@app/models/file';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class FilesService {

  constructor(private httpClient: HttpClient) {}

  getFiles(folder: Folder | Library): Observable<LibraryFile[]> {
    let folderPath;
    switch (folder.type) {
      case 'library':
        folderPath = folder.name; break;
      case 'folder':
        folderPath = `${folder.parent}/${folder.name}`;
    }
    return this.httpClient.get('http://localhost:8081/api/videos').pipe(
      // tap(obj => console.log(obj)),
      map(object => object as Array<LibraryFile>),
      map(files => files.filter(file => file.parent === folderPath))
    );

    /*return of(this.files).pipe(
      map(files => files.filter(file => file.parent === folder.path)),
      map(files => files.sort((a, b) => a.path.localeCompare(b.path))),
      /!*map(files => files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') {
          return -1;
        }
        if (a.type !== 'directory' && b.type === 'directory') {
          return 1;
        }
        return 0;
      }))*!/
    );*/
  }

  getLibraries(): Observable<Library[]> {
    return this.httpClient.get('http://localhost:8081/api/libraries').pipe(
      map(object => object as Array<Library>),
    );
  }

}
