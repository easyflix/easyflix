
export interface Video {
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
}

export interface Library {
  type: 'library';
  name: string;
  path: string;
}

export type LibraryFile = Folder | Video;

export interface MediaType {
  subType: string;
  extensions: string[];
}
