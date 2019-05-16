import {LibraryFile} from '@app/models/library-file';
import {Genre} from '@app/models/movie';

export interface Creator {
  id: number;
  credit_id: string;
  name: string;
  gender?: number;
  profile_path?: string;
}

export interface Network {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

export interface Season {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string;
  air_date?: string;
  episode_count: number;
  season_number: number;
}

export interface ShowDetails {
  id: number;
  created_by: Creator[];
  genres: Genre[];
  networks: Network[];
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Season[];
}

export interface Show {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  origin_country: string[];
  first_air_date: string;
  poster?: string;
  backdrop?: string;
  overview: string;
  vote_average: number;
  files: LibraryFile[];
  details?: ShowDetails;
}

