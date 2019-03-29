import {Library} from '@app/models/library';

export interface File {
  isDirectory: boolean;
  path: string;
  parent: string | Library;
  size?: number;
  lastModified: Date;
}
