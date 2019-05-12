
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

export interface MovieExt {
  id: number;
  title: string;
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

