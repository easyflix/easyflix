import {NgModule} from '@angular/core';

import {FileSizePipe} from './pipes/file-size.pipe';
import {SearchPipe} from './pipes/search.pipe';
import {TimePipe} from './pipes/time.pipe';
import {YearPipe} from './pipes/year.pipe';

export const PIPES = [
  FileSizePipe,
  SearchPipe,
  TimePipe,
  YearPipe
];

@NgModule({
  declarations: PIPES,
  exports: PIPES
})
export class PipesModule {}
