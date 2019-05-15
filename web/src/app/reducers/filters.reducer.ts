import {FiltersActionsUnion, FiltersActionTypes} from '@app/actions/filters.actions';

/**
 * State
 */
export interface State {
  show: boolean;
  search: string;
  rating: number;
  years: string[];
  languages: string[];
  tags: string[];
}

const initialState: State = {
  show: false,
  search: '',
  rating: 0,
  years: [],
  languages: [],
  tags: [],
};

/**
 * Reducer
 */
export function reducer(
  state: State = initialState,
  action: FiltersActionsUnion
): State {
  switch (action.type) {

    case FiltersActionTypes.ShowFilters:
      return {
        ...state,
        show: true
      };

    case FiltersActionTypes.HideFilters:
      return {
        ...state,
        show: false
      };

    case FiltersActionTypes.SetSearch:
      return {
        ...state,
        search: action.payload
      };

    case FiltersActionTypes.SetRating:
      return {
        ...state,
        rating: (action.payload || 0)
      };

    case FiltersActionTypes.SetYears:
      return {
        ...state,
        years: action.payload
      };

    case FiltersActionTypes.SetLanguages:
      return {
        ...state,
        languages: action.payload
      };

    case FiltersActionTypes.SetTags:
      return {
        ...state,
        tags: action.payload
      };

    case FiltersActionTypes.ClearFilters:
      return {
        ...initialState,
        show: state.show
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
export const getTags = (state: State) => state.tags;
