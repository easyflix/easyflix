interface LibraryI {
  name: string;
  path: string;
  scanning?: boolean;
}

export interface LocalLibrary extends LibraryI {
  type: 'local';
  totalSpace?: number;
  freeSpace?: number;
}

export interface FTPLibrary extends LibraryI {
  type: 'ftp';
  hostname: string;
  port: number;
  username: string;
  password?: string;
  passive: boolean;
  conType: 'ftp' | 'ftps';
}

export interface S3Library extends LibraryI {
  type: 's3';
  bucket: string;
  accessId: string;
  accessSecret: string;
  region: string;
}

export type Library = LocalLibrary | FTPLibrary | S3Library;
