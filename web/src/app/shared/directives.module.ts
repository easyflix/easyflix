import {NgModule} from '@angular/core';
import {PanelDirective} from './directives/panel.directive';

export const DIRECTIVES = [
  PanelDirective
];

@NgModule({
  declarations: DIRECTIVES,
  exports: DIRECTIVES
})
export class DirectivesModule {}
