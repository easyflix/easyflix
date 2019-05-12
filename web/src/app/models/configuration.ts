
export interface ImagesConfig {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface Configuration {
  images: ImagesConfig;
  languages: Language[];
}
