import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-loading-bar',
  template: `<mat-progress-bar mode="indeterminate"></mat-progress-bar>`,
  styles: [`
    :host {
      display: inline-block;
      width: 100%;
    }
    mat-progress-bar {
      height: 22px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingBarComponent {

}
