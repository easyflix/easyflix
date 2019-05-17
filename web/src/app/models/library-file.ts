
export interface LibraryFile {
  id?: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
  libraryName: string;
  tags?: string[];
  seasonNumber?: number;
  episodeNumber?: number;
}
