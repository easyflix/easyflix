import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-history',
  template: `
    <header>
      <h2>History</h2>
    </header>
    <mat-divider></mat-divider>
  `,
  styles: [`
    header {
      height: 59px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem
    }
    h2 {
      margin: 0;
      font-size: 18px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
