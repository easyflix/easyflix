import { Pipe, PipeTransform } from '@angular/core';

// https://gist.github.com/JonCatmull/ecdf9441aaa37336d9ae2c7f9cb7289a

/*
 * Convert bytes into largest possible unit.
 * Takes an precision argument that defaults to 2.
 * Usage:
 *   bytes | fileSize:precision
 * Example:
 *   {{ 1024 |  fileSize}}
 *   formats to: 1 KB
*/
@Pipe({name: 'sgFileSize'})
export class FileSizePipe implements PipeTransform {

  private units = [
    'bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB'
  ];

  transform(bytes: number = 0, precision: number = 2): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) { return '?'; }

    let unit = 0;

    while (bytes >= 1024) {
      bytes /= 1024;
      unit ++;
    }

    return bytes.toFixed(+precision) + ' ' + this.units[unit];
  }
}
