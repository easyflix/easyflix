export interface Library {
  type: 'local' | 'ftp' | 's3';
  name: string;
  path: string;
  scanning?: boolean;
}

export interface LocalLibrary extends Library {
  type: 'local';
}

export interface FTPLibrary extends Library {
  type: 'ftp';
  hostname: string;
  port: number;
  username: string;
  password: string;
  passive: boolean;
}

export interface S3Library extends Library {
  type: 's3';
}
