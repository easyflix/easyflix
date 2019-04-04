
interface IFile {
  type: 'video';
  id: string;
  name: string;
  parent: string;
  size: number;
  format: string;
}

interface IFolder {
  type: 'folder';
  name: string;
  parent: string;
}

interface ILibrary {
  type: 'library';
  name: string;
  path: string;
}

export type Video = IFile;
export type Folder = IFolder;
export type Library = ILibrary;
export type LibraryFile = IFolder | IFile;
