
export interface Video {
  type: 'video';
  id: string;
  name: string;
  parent: string;
  size: number;
  format: string;
}

export interface Folder {
  type: 'folder';
  name: string;
  parent: string;
}

export interface Library {
  type: 'library';
  name: string;
  path: string;
}

export type LibraryFile = Folder | Video;
