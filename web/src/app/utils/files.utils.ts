import {LibraryFile} from '@app/models';

export class FilesUtils {

  static getParentPath(file: LibraryFile) {
    const segments = file.path.split('/');
    return segments.slice(0, segments.length - 1).join('/');
  }

}
