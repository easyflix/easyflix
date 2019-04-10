import {FilesActionsUnion, FilesActionTypes} from '../actions/files.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {LibraryFile} from '@app/models/file';
import {LibrariesActionsUnion, LibrariesActionTypes} from '@app/actions/libraries.actions';

/**
 * State
 */
export const adapter: EntityAdapter<LibraryFile> = createEntityAdapter<LibraryFile>({
  selectId: file => file.id,
  sortComparer: (a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') {
      return -1;
    }
    if (a.type !== 'folder' && b.type === 'folder') {
      return 1;
    }
    return a.name.localeCompare(b.name);
  },
});

export interface State extends EntityState<LibraryFile> {
  loaded: boolean;
}

export const initialState: State = adapter.getInitialState({
  loaded: false
});

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: FilesActionsUnion | LibrariesActionsUnion
): State {
  switch (action.type) {

    case FilesActionTypes.LoadFilesSuccess: {
      const libraryFiles =
        action.payload.map(file => {
          if (file.type === 'folder') {
            return {
              ...file,
              numberOfVideos: action.payload
                .filter(f => f.type === 'video' && f.parent.startsWith(`${file.parent}${file.name}/`))
                .length
            };
          } else {
            return file;
          }
        }).filter(file => file.type === 'video' || file.numberOfVideos > 0); // ? should filter elsewhere ?
      return adapter.upsertMany(libraryFiles, {
        ...state,
        loaded: true
      });
    }

    case LibrariesActionTypes.RemoveLibrarySuccess: {
      const idsToRemove = (state.ids as string[]).filter(id => {
        const entity = state.entities[id];
        return entity.parent.startsWith(action.payload + '/');
      });
      return adapter.removeMany(idsToRemove, state);
    }

    default: return state;
  }
}

/**
 * Selectors
 */
export const getLoaded = (state: State) => state.loaded;
