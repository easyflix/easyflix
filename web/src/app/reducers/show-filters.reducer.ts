import {ShowFiltersActionsUnion, ShowFiltersActionTypes} from '@app/actions/show-filters.actions';

/**
 * State
 */
export interface State {
  show: boolean;
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  networks: string[];
  genres: string[];
}

const initialState: State = {
  show: false,
  search: '',
  rating: 0,
  years: [],
  languages: [],
  networks: [],
  genres: [],
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: ShowFiltersActionsUnion
): State {
  switch (action.type) {

    case ShowFiltersActionTypes.ToggleFilters:
      return {
        ...state,
        show: !state.show
      };

    case ShowFiltersActionTypes.SetSearch:
      return {
        ...state,
        search: action.payload
      };

    case ShowFiltersActionTypes.SetRating:
      return {
        ...state,
        rating: (action.payload || 0)
      };

    case ShowFiltersActionTypes.SetYears:
      return {
        ...state,
        years: action.payload
      };

    case ShowFiltersActionTypes.SetLanguages:
      return {
        ...state,
        languages: action.payload
      };

    case ShowFiltersActionTypes.SetNetworks:
      return {
        ...state,
        networks: action.payload
      };

    case ShowFiltersActionTypes.SetGenres:
      return {
        ...state,
        genres: action.payload
      };

    case ShowFiltersActionTypes.ClearFilters:
      return {
        ...initialState
      };

    default:
      return state;
  }
}

/**
 * Selectors
 */
export const getShow = (state: State) => state.show;
export const getSearch = (state: State) => state.search;
export const getRating = (state: State) => state.rating;
export const getYears = (state: State) => state.years;
export const getLanguages = (state: State) => state.languages;
export const getNetworks = (state: State) => state.networks;
export const getGenres = (state: State) => state.genres;
