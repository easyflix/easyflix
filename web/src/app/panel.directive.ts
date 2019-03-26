import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[app-panels]'
})
export class PanelDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
