
interface GenericFile {
  path: string;
  name: string;
}

interface INumberOfVideos {
  numberOfVideos: number;
}

interface IParent {
  parent: string;
}

interface IFile extends GenericFile, IParent {
  type: 'file';
  size: number;
  url: string;
}

interface IFolder extends GenericFile, IParent, INumberOfVideos {
  type: 'folder';
}

interface ILibrary extends GenericFile, INumberOfVideos {
  type: 'library';
}

/**
 *
 */
export type File = IFolder | IFile;
export type Library = ILibrary;
export type Folder = IFolder | ILibrary;
