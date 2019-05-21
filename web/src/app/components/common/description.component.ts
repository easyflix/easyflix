import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-dl',
  template: `
    <dl class="dl">
      <ng-content></ng-content>
    </dl>
  `,
  styles: [`
    .dl {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      width: 100%;
      line-height: 30px;
      max-height: 120px;
    }
    .dl dt {
      width: 8rem;
      padding-right: 1rem;
      box-sizing: border-box;
      font-weight: 400;
      margin: 0;
      text-align: right;
    }
    .dl dd {
      width: calc(100% - 8rem);
      align-items: center;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptionListComponent {

}
