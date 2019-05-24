import {MovieFiltersActionsUnion, MovieFiltersActionTypes} from '@app/actions/movie-filters.actions';

/**
 * State
 */
export interface State {
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  tags: string[];
  genres: string[];
}

const initialState: State = {
  search: '',
  rating: 0,
  years: [],
  languages: [],
  tags: [],
  genres: [],
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: MovieFiltersActionsUnion
): State {
  switch (action.type) {

    case MovieFiltersActionTypes.SetSearch:
      return {
        ...state,
        search: action.payload
      };

    case MovieFiltersActionTypes.SetRating:
      return {
        ...state,
        rating: (action.payload || 0)
      };

    case MovieFiltersActionTypes.SetYears:
      return {
        ...state,
        years: action.payload
      };

    case MovieFiltersActionTypes.SetLanguages:
      return {
        ...state,
        languages: action.payload
      };

    case MovieFiltersActionTypes.SetTags:
      return {
        ...state,
        tags: action.payload
      };

    case MovieFiltersActionTypes.SetGenres:
      return {
        ...state,
        genres: action.payload
      };

    case MovieFiltersActionTypes.ClearFilters:
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
export const getSearch = (state: State) => state.search;
export const getRating = (state: State) => state.rating;
export const getYears = (state: State) => state.years;
export const getLanguages = (state: State) => state.languages;
export const getTags = (state: State) => state.tags;
export const getGenres = (state: State) => state.genres;
