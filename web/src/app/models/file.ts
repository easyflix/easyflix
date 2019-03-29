export interface File {
  path: string;
  parent: string;
  isDirectory: boolean;
  size?: number;
}
