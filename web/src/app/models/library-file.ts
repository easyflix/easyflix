
export interface LibraryFile {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
  libraryName: string;
  numberOfVideos?: number;
}

/*export interface Video {
  type: 'video';
  id: string;
  name: string;
  parent: string;
  size: number;
}

export interface Folder {
  type: 'folder';
  id: string;
  name: string;
  parent: string;
}*/

// export type LibraryFile = Folder | Video;
