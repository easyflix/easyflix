import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-overview',
  template: `
    <p><ng-content></ng-content></p>
  `,
  styles: [`
    :host {
      display: flex;
    }
    p {
      margin: 0;
      font-weight: 300;
      line-height: 30px;
      max-height: 120px;
      overflow-y: auto;
      padding-right: .5rem;
    }
    p::-webkit-scrollbar {
      width: .5rem;
    }
    p::-webkit-scrollbar-thumb {
      border-radius: .5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent {

}
