
export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails {
  budget: number;
  genres: Genre[];
  revenue: number;
  runtime?: number;
}
