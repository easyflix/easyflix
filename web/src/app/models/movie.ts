import {LibraryFile} from '@app/models/library-file';

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
  file: LibraryFile;
}
