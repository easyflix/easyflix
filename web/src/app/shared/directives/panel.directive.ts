import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appPanels]'
})
export class PanelDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
