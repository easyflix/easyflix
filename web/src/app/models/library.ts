interface LibraryI {
  name: string;
  path: string;
  scanning?: boolean;
}

export interface LocalLibrary extends LibraryI {
  type: 'local';
}

export interface FTPLibrary extends LibraryI {
  type: 'ftp';
  hostname: string;
  port: number;
  username: string;
  password: string;
  passive: boolean;
}

export interface S3Library extends LibraryI {
  type: 's3';
}

export type Library = LocalLibrary | FTPLibrary | S3Library;
