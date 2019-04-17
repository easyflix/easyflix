import {FilesActionsUnion, FilesActionTypes} from '../actions/files.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {LibraryFile} from '@app/models/library-file';
import {LibrariesActionsUnion, LibrariesActionTypes} from '@app/actions/libraries.actions';

/**
 * State
 */
export const adapter: EntityAdapter<LibraryFile> = createEntityAdapter<LibraryFile>({
  selectId: file => file.path,
  sortComparer: (a, b) => {
    if (a.isDirectory === true && b.isDirectory === false) {
      return -1;
    }
    if (a.isDirectory === false && b.isDirectory === true) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  },
});

export interface State extends EntityState<LibraryFile> {}

export const initialState: State = adapter.getInitialState({});

function processLibraryFiles(files: LibraryFile[]): LibraryFile[] {
  return files.map(file => {
    if (file.isDirectory === true) {
      return {
        ...file,
        numberOfVideos: files
          .filter(f => f.isDirectory === false && f.path.startsWith(`${file.path}/`))
          .length
      };
    } else {
      return file;
    }
  }).filter(file => file.isDirectory === false || file.numberOfVideos > 0); // TODO ? should filter elsewhere ?
}

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: FilesActionsUnion | LibrariesActionsUnion
): State {
  switch (action.type) {

    case FilesActionTypes.LoadFilesSuccess: {
      return adapter.upsertMany(processLibraryFiles(action.payload), state);
    }

    case LibrariesActionTypes.ScanLibrarySuccess: {
      return adapter.upsertMany(processLibraryFiles(action.payload), state);
    }

    case LibrariesActionTypes.RemoveLibrarySuccess: {
      const idsToRemove = (state.ids as string[]).filter(path => {
        const entity = state.entities[path];
        return entity.path === action.payload.path || entity.path.startsWith(action.payload.path + '/');
      });
      return adapter.removeMany(idsToRemove, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
// export const getLoaded = (state: State) => state.loaded;
