import {NgModule} from '@angular/core';

import {FileSizePipe} from './pipes/file-size.pipe';
import {SearchPipe} from './pipes/search.pipe';
import {TimePipe} from './pipes/time.pipe';
import {YearPipe} from './pipes/year.pipe';
import {SearchTermsPipe} from './pipes/search-terms.pipe';

export const PIPES = [
  FileSizePipe,
  SearchPipe,
  TimePipe,
  YearPipe,
  SearchTermsPipe
];

@NgModule({
  declarations: PIPES,
  exports: PIPES
})
export class PipesModule {}
