import {FilesActionsUnion, FilesActionTypes} from '../actions/files.actions';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {LibraryFile} from '@app/models/file';

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

export interface State extends EntityState<LibraryFile> {}

export const initialState: State = adapter.getInitialState();

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: FilesActionsUnion
): State {
  switch (action.type) {

    case FilesActionTypes.LoadFilesSuccess:
      return adapter.upsertMany(action.payload, state);

    default:
      return state;
  }
}

/**
 * Selectors
 */
