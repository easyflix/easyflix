import {LibraryFile} from '@app/models/library-file';

export interface Genre {
  id: number;
  name: string;
}

export interface Cast {
  cast_id: number;
  character: string;
  credit_id: string;
  gender?: number;
  id: number;
  name: string;
  order: number;
  profile_path?: string;
}

export interface Crew {
  credit_id: string;
  department: string;
  gender?: number;
  id: number;
  job: string;
  name: string;
  profile_path?: string;
}

export interface MovieDetails {
  id: number;
  budget: number;
  genres: Genre[];
  revenue: number;
  runtime?: number;
  tagline?: string;
  credits: {
    cast: Cast[];
    crew: Crew[];
  };
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  release_date: string;
  poster?: string;
  backdrop?: string;
  overview: string;
  vote_average: number;
  files: LibraryFile[];
  details?: MovieDetails;
}
